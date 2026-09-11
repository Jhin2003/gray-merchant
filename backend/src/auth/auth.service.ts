import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma, UserType, User, Session } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  accessTokenTtl,
  positiveInteger,
  resolveJwtSecret,
} from './auth.config';

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  type: UserType;
}

export interface AuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginOptions extends AuthContext {
  allowedTypes?: UserType[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------- shared helpers (used by user / staff / admin flows) ----------

  async registerUser(args: {
    email: string;
    password: string;
    type: UserType;
  }): Promise<User> {
    const normalizedEmail = args.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException({
        errorCode: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
      });
    }

    const saltRounds = positiveInteger(
      this.config.get<string>('BCRYPT_SALT_ROUNDS'),
      12,
      'BCRYPT_SALT_ROUNDS',
    );
    const hashed = await bcrypt.hash(args.password, saltRounds);

    try {
      return await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          type: args.type,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          errorCode: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already exists',
        });
      }
      throw error;
    }
  }

  async loginUser(
    args: { email: string; password: string },
    options: LoginOptions = {},
  ): Promise<SessionResult> {
    const normalizedEmail = args.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    if (options.allowedTypes && !options.allowedTypes.includes(user.type)) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    const now = new Date();
    if (user.lockedUntil && new Date(user.lockedUntil) > now) {
      throw new UnauthorizedException({
        errorCode: 'ACCOUNT_LOCKED',
        message: 'Account locked due to repeated failed login attempts',
      });
    }

    let failedLoginAttempts = user.failedLoginAttempts ?? 0;
    if (user.lockedUntil && new Date(user.lockedUntil) <= now) {
      failedLoginAttempts = 0;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const isValid = await bcrypt.compare(args.password, user.password);
    if (!isValid) {
      const maxFailedAttempts = positiveInteger(
        this.config.get<string>('MAX_FAILED_LOGIN_ATTEMPTS'),
        5,
        'MAX_FAILED_LOGIN_ATTEMPTS',
      );
      const lockMinutes = positiveInteger(
        this.config.get<string>('ACCOUNT_LOCK_MINUTES'),
        15,
        'ACCOUNT_LOCK_MINUTES',
      );
      const failedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });

      if (failedUser.failedLoginAttempts >= maxFailedAttempts) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + lockMinutes * 60 * 1000),
          },
        });
        await this.audit.log('ACCOUNT_LOCKED', {
          userId: user.id,
          ipAddress: options.ipAddress,
        });
      }
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    if (failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const session = await this.createSession({
      user,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    return { ...session, userId: user.id, type: user.type };
  }

  async createSession(args: {
    user: User;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.signAccessToken({
      userId: args.user.id,
      type: args.user.type,
      roleId: args.user.roleId ?? null,
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const ttlDays = positiveInteger(
      this.config.get<string>('JWT_REFRESH_TTL_DAYS'),
      30,
      'JWT_REFRESH_TTL_DAYS',
    );
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const maxSessions = positiveInteger(
      this.config.get<string>('MAX_SESSIONS_PER_USER'),
      5,
      'MAX_SESSIONS_PER_USER',
    );
    const sessionsToRemove = await this.prisma.session.findMany({
      where: { userId: args.user.id },
      orderBy: { createdAt: 'desc' },
      skip: Math.max(0, maxSessions - 1),
      select: { id: true },
    });
    if (sessionsToRemove.length > 0) {
      await this.prisma.session.deleteMany({
        where: { id: { in: sessionsToRemove.map(({ id }) => id) } },
      });
    }

    await this.prisma.session.create({
      data: {
        token: accessToken,
        refreshToken,
        expiresAt,
        userId: args.user.id,
        userAgent: args.userAgent ?? null,
        ipAddress: args.ipAddress ?? null,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    refreshToken: string,
    ctx: AuthContext = {},
  ): Promise<SessionResult | null> {
    if (!refreshToken) return null;

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!session) return null;

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) return null;

    const accessToken = this.signAccessToken({
      userId: user.id,
      type: user.type,
      roleId: user.roleId ?? null,
    });
    const newRefreshToken = crypto.randomBytes(64).toString('hex');

    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, refreshToken },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        userAgent: ctx.userAgent ?? session.userAgent,
        ipAddress: ctx.ipAddress ?? session.ipAddress,
      },
    });
    if (rotated.count !== 1) return null;

    await this.audit.log('TOKEN_REFRESH', {
      userId: user.id,
      ipAddress: ctx.ipAddress,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      userId: user.id,
      type: user.type,
    };
  }

  async revokeSession(args: {
    refreshToken?: string | null;
    accessToken?: string | null;
    ipAddress?: string | null;
  }): Promise<boolean> {
    let session: Session | null = null;
    if (args.refreshToken) {
      session = await this.prisma.session.findUnique({
        where: { refreshToken: args.refreshToken },
      });
    } else if (args.accessToken) {
      session = await this.prisma.session.findUnique({
        where: { token: args.accessToken },
      });
    }
    if (!session) return false;
    const userId = session.userId;
    await this.prisma.session.delete({ where: { id: session.id } });
    await this.audit.log('LOGOUT', {
      userId,
      ipAddress: args.ipAddress,
    });
    return true;
  }

  // ---------- OAuth2 / SSO helpers ----------

  async createAuthorizationCode(args: {
    userId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge?: string | null;
    codeChallengeMethod?: string | null;
    expiresInMs?: number;
  }): Promise<{ code: string }> {
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + (args.expiresInMs ?? 10 * 60 * 1000),
    );
    await this.prisma.authorizationCode.create({
      data: {
        code,
        clientId: args.clientId,
        redirectUri: args.redirectUri,
        userId: args.userId,
        codeChallenge: args.codeChallenge ?? null,
        codeChallengeMethod: args.codeChallengeMethod ?? null,
        expiresAt,
      },
    });
    return { code };
  }

  async consumeAuthorizationCode(args: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier?: string | null;
  }): Promise<{ userId: string } | null> {
    const authCode = await this.prisma.authorizationCode.findUnique({
      where: { code: args.code },
    });
    if (
      !authCode ||
      authCode.used ||
      authCode.clientId !== args.clientId ||
      authCode.redirectUri !== args.redirectUri
    ) {
      return null;
    }
    if (authCode.expiresAt && new Date(authCode.expiresAt) < new Date()) {
      await this.prisma.authorizationCode.delete({
        where: { id: authCode.id },
      });
      return null;
    }

    if (authCode.codeChallenge) {
      if (!args.codeVerifier) return null;
      const method = (authCode.codeChallengeMethod ?? 'S256').toUpperCase();
      if (method === 'S256') {
        const hash = crypto
          .createHash('sha256')
          .update(args.codeVerifier)
          .digest();
        const expected = hash
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        if (expected !== authCode.codeChallenge) return null;
      } else if (method === 'PLAIN') {
        if (args.codeVerifier !== authCode.codeChallenge) return null;
      } else {
        return null;
      }
    }

    const consumed = await this.prisma.authorizationCode.updateMany({
      where: { id: authCode.id, used: false },
      data: { used: true },
    });
    if (consumed.count !== 1) return null;
    return { userId: authCode.userId };
  }

  signAccessToken(payload: {
    userId: string;
    type: UserType;
    roleId: number | null;
  }): string {
    const options = {
      secret: resolveJwtSecret(this.config),
      expiresIn: accessTokenTtl(this.config),
      // Identical payloads signed during the same second would otherwise
      // produce the same JWT and violate Session.token's unique constraint.
      jwtid: crypto.randomUUID(),
    } as Parameters<JwtService['sign']>[1];
    return this.jwt.sign(payload, options);
  }

  async generateClientToken(
    clientId: string,
  ): Promise<{ accessToken: string }> {
    const token = await this.jwt.signAsync(
      { clientId },
      {
        secret: resolveJwtSecret(this.config),
        expiresIn: '1h',
      },
    );
    return { accessToken: token };
  }
}
