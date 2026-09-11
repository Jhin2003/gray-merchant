import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthService } from './auth.service';
import { registerSchema } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { staffLoginSchema } from './dto/staff-login.dto';
import { refreshSchema } from './dto/refresh.dto';
import { authorizeQuerySchema, tokenSchema } from './dto/authorize.dto';
import { clientTokenSchema } from './dto/client-token.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  assertPresent,
  throwApiError,
  zodIssuesToDetails,
} from '../common/http';
import {
  buildSessionCookieOptions,
  getAuthSessionCookieName,
  getRefreshTokenFromRequest,
} from '../common/cookies';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  UserTypeGuard,
  AllowedTypes,
} from './guards';
import { AccessTokenPayload } from './jwt-payload';
import { UserType } from '../../generated/prisma/enums';
import { Throttle } from '@nestjs/throttler';
import { accessTokenTtlSeconds } from './auth.config';
import { verifyClientSecret } from './client-secret';

interface AuthedRequest extends Request {
  user?: AccessTokenPayload;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  // ---------- registration (regular users only) ----------

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ register: {} })
  async register(@Body() body: unknown, @Req() req: Request) {
    const parsed = registerSchema.parse(body);
    const user = await this.auth.registerUser({
      email: parsed.email,
      password: parsed.password,
      type: UserType.USER,
    });
    await this.audit.log('REGISTER_SUCCESS', {
      userId: user.id,
      ipAddress: req.ip,
    });
    return {
      message: 'User registered',
      data: {
        id: user.id,
        email: user.email,
        type: user.type,
        roleId: user.roleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // ---------- user login (shop customers) ----------

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: {} })
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = loginSchema.parse(body);
    const ipAddress = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;

    if (parsed.client_id && parsed.redirect_uri) {
      await this.validateAuthorizationClient(
        parsed.client_id,
        parsed.redirect_uri,
      );
    }

    const result = await this.auth.loginUser(
      { email: parsed.email, password: parsed.password },
      {
        allowedTypes: [UserType.USER],
        ipAddress,
        userAgent,
      },
    );

    await this.audit.log('LOGIN_SUCCESS', {
      userId: result.userId,
      ipAddress,
    });

    res.cookie(
      getAuthSessionCookieName(),
      result.refreshToken,
      buildSessionCookieOptions(),
    );

    if (parsed.client_id && parsed.redirect_uri) {
      const redirect = await this.handleAuthorizationCodeGrant({
        userId: result.userId,
        clientId: parsed.client_id,
        redirectUri: parsed.redirect_uri,
        state: parsed.state,
        codeChallenge: parsed.code_challenge,
        codeChallengeMethod: parsed.code_challenge_method,
      });
      if (redirect) {
        return res.redirect(redirect);
      }
    }

    return {
      message: 'Login successful',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.userId, type: result.type },
    };
  }
  // ---------- staff login (separate endpoint, requires app client) ----------

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: {} })
  async staffLogin(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = staffLoginSchema.parse(body);
    const ipAddress = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;

    const application = await this.prisma.application.findUnique({
      where: { clientId: parsed.client_id },
    });
    if (!application) {
      throwApiError(400, 'INVALID_CLIENT', 'Invalid client_id');
    }
    const authedApp = assertPresent(application, 'application');
    if (authedApp.clientSecret) {
      const valid = await verifyClientSecret(
        parsed.client_secret,
        authedApp.clientSecret,
      );
      if (!valid) {
        throwApiError(401, 'INVALID_CLIENT_SECRET', 'Invalid client_secret');
      }
    }

    const result = await this.auth.loginUser(
      { email: parsed.email, password: parsed.password },
      {
        allowedTypes: [UserType.STAFF, UserType.ADMIN],
        ipAddress,
        userAgent,
      },
    );

    const action =
      result.type === UserType.ADMIN
        ? 'ADMIN_LOGIN_SUCCESS'
        : 'STAFF_LOGIN_SUCCESS';
    await this.audit.log(action, { userId: result.userId, ipAddress });

    res.cookie(
      getAuthSessionCookieName(),
      result.refreshToken,
      buildSessionCookieOptions(),
    );

    return {
      message: 'Staff login successful',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.userId, type: result.type },
    };
  }

  // ---------- session / refresh / logout ----------

  @Get('session')
  @UseGuards(OptionalJwtAuthGuard)
  async session(@Req() req: AuthedRequest) {
    const cookieToken = getRefreshTokenFromRequest(req);
    if (cookieToken) {
      const session = await this.prisma.session.findUnique({
        where: { refreshToken: cookieToken },
      });
      if (
        session &&
        (!session.expiresAt || new Date(session.expiresAt) > new Date())
      ) {
        const user = await this.prisma.user.findUnique({
          where: { id: session.userId },
        });
        if (user) {
          return {
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              type: user.type,
              roleId: user.roleId,
            },
          };
        }
      }
    }

    if (req.user) {
      return {
        authenticated: true,
        user: {
          id: req.user.userId,
          type: req.user.type,
          roleId: req.user.roleId,
        },
      };
    }
    return { authenticated: false };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = refreshSchema.parse(body ?? {});
    const cookieToken = getRefreshTokenFromRequest(req);
    const supplied = parsed.refreshToken ?? cookieToken;
    if (!supplied) {
      throwApiError(400, 'MISSING_TOKEN', 'Missing refresh token');
    }
    const token = assertPresent(supplied, 'refresh token');

    const ipAddress = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;

    const result = await this.auth.refreshAccessToken(token, {
      ipAddress,
      userAgent,
    });
    if (!result) {
      throwApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
    }
    const session = assertPresent(result, 'refresh result');

    res.cookie(
      getAuthSessionCookieName(),
      session.refreshToken,
      buildSessionCookieOptions(),
    );

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: { id: session.userId, type: session.type },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = refreshSchema.parse(body ?? {});
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    const cookieToken = getRefreshTokenFromRequest(req);

    const ok = await this.auth.revokeSession({
      refreshToken: parsed.refreshToken ?? cookieToken ?? null,
      accessToken: accessToken ?? null,
      ipAddress: req.ip ?? null,
    });
    if (!ok) {
      throwApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    res.clearCookie(getAuthSessionCookieName(), {
      ...buildSessionCookieOptions(),
      maxAge: 0,
    });
    return { message: 'Logged out' };
  }

  // ---------- OAuth2 / SSO endpoints ----------

  @Get('authorize')
  async authorize(@Query() query: Record<string, string>, @Req() req: Request) {
    const parsed = authorizeQuerySchema.parse(query);
    await this.audit.log('APP_AUTH_REQUEST', { ipAddress: req.ip });

    const application = await this.prisma.application.findUnique({
      where: { clientId: parsed.client_id },
    });
    if (!application) throwApiError(400, 'INVALID_CLIENT', 'Invalid client_id');
    const redirectUri = assertPresent(application, 'application').redirectUri;
    if (redirectUri !== parsed.redirect_uri) {
      throwApiError(400, 'INVALID_REDIRECT_URI', 'Invalid redirect_uri');
    }

    const loginUrl = new URL(
      process.env.FRONTEND_LOGIN_URL ?? 'http://localhost:3000/auth',
    );
    loginUrl.searchParams.set('client_id', parsed.client_id);
    loginUrl.searchParams.set('redirect_uri', parsed.redirect_uri);
    if (parsed.state) loginUrl.searchParams.set('state', parsed.state);
    if (parsed.code_challenge) {
      loginUrl.searchParams.set('code_challenge', parsed.code_challenge);
    }
    if (parsed.code_challenge_method) {
      loginUrl.searchParams.set(
        'code_challenge_method',
        parsed.code_challenge_method,
      );
    }
    return { redirect: loginUrl.toString() };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async token(@Body() body: unknown, @Req() req: Request) {
    const parsed = tokenSchema.parse(body);
    const application = await this.prisma.application.findUnique({
      where: { clientId: parsed.client_id },
    });
    if (!application) throwApiError(400, 'INVALID_CLIENT', 'Invalid client_id');
    const tokenRedirectUri = assertPresent(
      application,
      'application',
    ).redirectUri;
    if (tokenRedirectUri !== parsed.redirect_uri) {
      throwApiError(400, 'INVALID_REDIRECT_URI', 'Invalid redirect_uri');
    }
    const tokenClientSecret = assertPresent(
      application,
      'application',
    ).clientSecret;
    if (tokenClientSecret) {
      const valid = await verifyClientSecret(
        parsed.client_secret,
        tokenClientSecret,
      );
      if (!valid) {
        throwApiError(401, 'INVALID_CLIENT_SECRET', 'Invalid client_secret');
      }
    }

    const consumed = await this.auth.consumeAuthorizationCode({
      code: parsed.code,
      clientId: parsed.client_id,
      redirectUri: parsed.redirect_uri,
      codeVerifier: parsed.code_verifier ?? null,
    });
    if (!consumed) {
      throwApiError(
        400,
        'INVALID_CODE',
        'Invalid or expired authorization code',
      );
    }
    const codeUserId = assertPresent(consumed, 'authorization code').userId;

    const user = await this.prisma.user.findUnique({
      where: { id: codeUserId },
    });
    if (!user) {
      throwApiError(400, 'INVALID_CODE', 'Invalid authorization code user');
    }
    const authedUser = assertPresent(user, 'user');

    const session = await this.auth.createSession({
      user: authedUser,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return {
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      token_type: 'Bearer',
      expires_in: accessTokenTtlSeconds(this.config),
    };
  }

  @Post('client-token')
  @HttpCode(HttpStatus.OK)
  async clientToken(@Body() body: unknown, @Req() req: Request) {
    if (
      typeof body !== 'object' ||
      body === null ||
      !('clientId' in body) ||
      !body.clientId
    ) {
      throwApiError(400, 'MISSING_CLIENT_ID', 'clientId required');
    }
    const parsed = clientTokenSchema.parse(body);
    const application = await this.prisma.application.findUnique({
      where: { clientId: parsed.clientId },
    });
    if (!application) throwApiError(400, 'INVALID_CLIENT', 'Invalid client');
    const authedApplication = assertPresent(application, 'application');
    if (
      !authedApplication.clientSecret ||
      !(await verifyClientSecret(
        parsed.clientSecret,
        authedApplication.clientSecret,
      ))
    ) {
      throwApiError(401, 'INVALID_CLIENT_SECRET', 'Invalid client_secret');
    }
    const token = await this.auth.generateClientToken(
      authedApplication.clientId,
    );
    await this.audit.log('CLIENT_TOKEN_ISSUED', { ipAddress: req.ip });
    return token;
  }

  // ---------- protected example endpoints ----------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthedRequest) {
    return { user: req.user };
  }

  @Get('admin')
  @AllowedTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  admin(@Req() req: AuthedRequest) {
    return { message: 'admin access granted', user: req.user };
  }

  // ---------- private helpers ----------

  private async handleAuthorizationCodeGrant(args: {
    userId: string;
    clientId: string;
    redirectUri: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): Promise<string | null> {
    const created = await this.auth.createAuthorizationCode({
      userId: args.userId,
      clientId: args.clientId,
      redirectUri: args.redirectUri,
      codeChallenge: args.codeChallenge ?? null,
      codeChallengeMethod: args.codeChallengeMethod ?? null,
    });

    await this.audit.log('APP_AUTH_GRANTED', { userId: args.userId });

    const params = new URLSearchParams({ code: created.code });
    if (args.state) params.set('state', args.state);
    return `${args.redirectUri}?${params.toString()}`;
  }

  private async validateAuthorizationClient(
    clientId: string,
    redirectUri: string,
  ): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { clientId },
    });
    if (!application) {
      throwApiError(400, 'INVALID_CLIENT', 'Invalid client_id');
    }
    const registeredRedirectUri = assertPresent(
      application,
      'application',
    ).redirectUri;
    if (registeredRedirectUri !== redirectUri) {
      throwApiError(400, 'INVALID_REDIRECT_URI', 'Invalid redirect_uri');
    }
  }

  static errorHandler(err: unknown, ctx: { logger: Logger }) {
    if (err instanceof ZodError) {
      throwApiError(400, 'VALIDATION_ERROR', 'Invalid input', {
        details: zodIssuesToDetails(err.issues),
      });
    }
    ctx.logger.error(err);
    throwApiError(500, 'SERVER_ERROR', 'Something went wrong');
  }
}
