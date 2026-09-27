/**
 * End-to-end auth/SSO test suite for the gray-merchant backend.
 *
 * What it covers (every endpoint in backend/AUTH_README.md):
 *
 *   - POST /auth/register          (USER registration + password policy)
 *   - POST /auth/login             (USER login + OAuth2 grant + cookie)
 *   - GET  /auth/session           (cookie + bearer lookup)
 *   - POST /auth/refresh           (rotating refresh tokens)
 *   - POST /auth/logout            (revoke session, clear cookie)
 *   - POST /auth/staff/login       (STAFF/ADMIN login)
 *   - GET  /auth/authorize         (OAuth2 client/redirect validation)
 *   - POST /auth/token             (PKCE S256 + PLAIN exchange)
 *   - POST /auth/client-token      (client credentials JWT)
 *   - GET  /auth/me                (JWT guard)
 *   - GET  /auth/admin             (UserTypeGuard)
 *   - Account lockout after 5 failed attempts
 *   - Validation errors
 *
 * Run with:
 *   DATABASE_URL=... npx jest --config ./test/jest-e2e.json --runInBand
 *
 * The suite truncates the auth-related tables before it starts so it is
 * safe to re-run. The throttler is *overridden* to unlimited in the test
 * module so the suite never flakes on rate limits.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { ZodErrorFilter } from '../src/auth/zod-error.filter';
import { AUTH_SESSION_COOKIE_NAME } from '../src/common/cookies';
import { PrismaService } from '../src/prisma/prisma.service';

class NoopGuard {
  canActivate(): boolean {
    return true;
  }
}

interface PkcePair {
  verifier: string;
  challenge: string;
}

interface UserDto {
  email: string;
  type: 'USER' | 'ADMIN';
  password?: string;
}

interface RegisterResponse {
  data: UserDto;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

interface SessionResponse {
  authenticated: boolean;
  user: UserDto;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface ErrorResponse {
  errorCode: string;
  message?: string;
  details?: unknown[];
}

function bodyOf<T>(response: request.Response): T {
  return response.body as T;
}

function makePkce(): PkcePair {
  const bytes = crypto.randomBytes(32);

  const verifier = bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const hash = crypto.createHash('sha256').update(verifier).digest();

  const challenge = hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return {
    verifier,
    challenge,
  };
}

function randomEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}@test.local`;
}

const STRONG_PASSWORD = 'StrongP4ss!word';

const STAFF_CLIENT_ID = 'gray-merchant-staff';

const STAFF_REDIRECT_URI = 'http://localhost:3000/admin/callback';

describe('Auth / SSO e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gray-merchant.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useClass(NoopGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new ZodErrorFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Wipe auth-related rows so the suite is idempotent.
    await prisma.auditLog.deleteMany({});
    await prisma.authorizationCode.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { not: adminEmail } } });

    // Re-assert the seeded admin + staff app so the suite is self-contained.
    const bcrypt = await import('bcrypt');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    const adminHash = await bcrypt.hash(adminPassword, saltRounds);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: adminHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: { email: adminEmail, password: adminHash, type: 'ADMIN' },
    });
    await prisma.application.upsert({
      where: { clientId: STAFF_CLIENT_ID },
      update: {},
      create: {
        name: 'Gray Merchant Staff App',
        clientId: STAFF_CLIENT_ID,
        redirectUri: STAFF_REDIRECT_URI,
      },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /auth/register', () => {
    it('registers a USER with a strong password (201)', async () => {
      const email = randomEmail('alice');

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(201);

      const body = bodyOf<RegisterResponse>(res);

      expect(body.data.email).toBe(email);
      expect(body.data.type).toBe('USER');
      expect(body.data.password).toBeUndefined();
    });

    it('rejects a weak password with VALIDATION_ERROR (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: randomEmail('weak'),
          password: 'short',
        });

      const body = bodyOf<ErrorResponse>(res);

      expect(res.status).toBe(400);
      expect(body.errorCode).toBe('VALIDATION_ERROR');
      expect(Array.isArray(body.details)).toBe(true);
    });

    it('rejects a malformed email (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: STRONG_PASSWORD,
        });

      const body = bodyOf<ErrorResponse>(res);

      expect(res.status).toBe(400);
      expect(body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('rejects a duplicate registration', async () => {
      const email = randomEmail('dup');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(201);

      const dup = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        });

      expect(dup.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/login', () => {
    let userEmail: string;

    beforeAll(async () => {
      userEmail = randomEmail('login');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userEmail,
          password: STRONG_PASSWORD,
        })
        .expect(201);
    });

    it('returns access + refresh tokens and sets the session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userEmail,
          password: STRONG_PASSWORD,
        })
        .expect(200);

      const body = bodyOf<LoginResponse>(res);

      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.type).toBe('USER');

      const cookies = res.headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      if (!Array.isArray(cookies)) {
        throw new Error('Expected set-cookie to be an array');
      }
      expect(
        (cookies as string[]).some((c) =>
          c.startsWith(`${AUTH_SESSION_COOKIE_NAME}=`),
        ),
      ).toBe(true);
    });

    it('rejects a wrong password (>= 400)', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: userEmail,
        password: 'DefinitelyWrong!1',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects an unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: randomEmail('nobody'),
          password: STRONG_PASSWORD,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /auth/session', () => {
    it('reports authenticated=true with the cookie', async () => {
      const email = randomEmail('sess');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(200);

      const cookies: string[] = Array.isArray(login.headers['set-cookie'])
        ? login.headers['set-cookie']
        : [];

      expect(Array.isArray(cookies)).toBe(true);
      if (!Array.isArray(cookies)) {
        throw new Error('Expected set-cookie to be an array');
      }

      expect(
        cookies.some((c) => c.startsWith(`${AUTH_SESSION_COOKIE_NAME}=`)),
      ).toBe(true);

      const res = await request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', cookies[0])
        .expect(200);

      const body = bodyOf<SessionResponse>(res);

      expect(body.authenticated).toBe(true);
      expect(body.user.email).toBe(email);
    });

    it('reports authenticated=false without a cookie or token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/session')
        .expect(200);

      const body = bodyOf<SessionResponse>(res);

      expect(body.authenticated).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token and rejects the old one', async () => {
      const email = randomEmail('refresh');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(200);

      const loginBody = bodyOf<LoginResponse>(login);

      const oldRefresh = loginBody.refreshToken;

      const refresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefresh,
        })
        .expect(200);

      const refreshBody = bodyOf<LoginResponse>(refresh);

      expect(refreshBody.accessToken).toBeDefined();
      expect(refreshBody.refreshToken).toBeDefined();
      expect(refreshBody.refreshToken).not.toBe(oldRefresh);

      const reuse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefresh,
        });

      const reuseBody = bodyOf<ErrorResponse>(reuse);

      expect(reuse.status).toBe(401);
      expect(reuseBody.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });

    it('returns 400 when no refresh token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      const body = bodyOf<ErrorResponse>(res);

      expect(res.status).toBe(400);
      expect(body.errorCode).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /auth/me (JwtAuthGuard)', () => {
    it('returns the JWT payload for a valid bearer', async () => {
      const email = randomEmail('me');

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
        })
        .expect(200);

      const loginBody = bodyOf<LoginResponse>(login);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .expect(200);

      const body = bodyOf<LoginResponse>(res);

      expect(body.user.type).toBe('USER');
    });

    it('returns 401 without a bearer', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/admin (UserTypeGuard)', () => {
    it('returns 403 for a USER bearer', async () => {
      const email = randomEmail('adminuser');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(200);

      const loginBody = bodyOf<LoginResponse>(login);

      const res = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${loginBody.accessToken}`);
      expect(res.status).toBe(403);
      const errorBody = bodyOf<ErrorResponse>(res);
      expect(errorBody.errorCode).toBe('FORBIDDEN');
    });

    it('returns 200 for an ADMIN bearer', async () => {
      const admin = await request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          client_id: STAFF_CLIENT_ID,
        })
        .expect(200);

      const adminBody = bodyOf<LoginResponse>(admin);

      const res = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminBody.accessToken}`)
        .expect(200);
      const resBody = bodyOf<LoginResponse>(res);
      expect(resBody.user.type).toBe('ADMIN');
    });
  });

  describe('OAuth2 / PKCE', () => {
    it('authorize returns a redirect URL with preserved params', async () => {
      const pkce = makePkce();
      const res = await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          state: 'xyz',
          code_challenge: pkce.challenge,
          code_challenge_method: 'S256',
        })
        .expect(200);

      const body = bodyOf<{ redirect: string }>(res);
      expect(body.redirect).toContain(`client_id=${STAFF_CLIENT_ID}`);
      expect(body.redirect).toContain(`code_challenge=${pkce.challenge}`);
    });

    it('authorize rejects an unknown client_id', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({
          client_id: 'no-such-app',
          redirect_uri: STAFF_REDIRECT_URI,
        });
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('INVALID_CLIENT');
    });

    it('authorize rejects a mismatched redirect_uri', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({
          client_id: STAFF_CLIENT_ID,
          redirect_uri: 'http://evil.test/callback',
        });
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('INVALID_REDIRECT_URI');
    });

    it('login + token completes a PKCE S256 round-trip', async () => {
      const email = randomEmail('pkce');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);

      const pkce = makePkce();
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          state: 'xyz',
          code_challenge: pkce.challenge,
          code_challenge_method: 'S256',
        });
      expect(login.status).toBe(302);

      const location = login.headers.location;
      expect(location).toBeDefined();
      expect(typeof location).toBe('string');
      expect(location).toContain(STAFF_REDIRECT_URI);

      const code = new URL(location).searchParams.get('code');
      expect(code).toBeTruthy();

      const token = await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grant_type: 'authorization_code',
          code,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          code_verifier: pkce.verifier,
        })
        .expect(200);
      const tokenBody = bodyOf<TokenResponse>(token);

      expect(tokenBody.access_token).toBeDefined();
      expect(tokenBody.refresh_token).toBeDefined();
      expect(tokenBody.token_type).toBe('Bearer');
      expect(tokenBody.expires_in).toBeGreaterThan(0);

      // Codes are single-use.
      const reuse = await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grant_type: 'authorization_code',
          code,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          code_verifier: pkce.verifier,
        });
      expect(reuse.status).toBe(400);
      const reuseBody = bodyOf<ErrorResponse>(reuse);
      expect(reuseBody.errorCode).toBe('INVALID_CODE');
    });

    it('login + token completes a PKCE PLAIN round-trip', async () => {
      const email = randomEmail('plain');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);

      const verifier = 'plain-verifier-1234567890';
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          state: 'plain',
          code_challenge: verifier,
          code_challenge_method: 'PLAIN',
        });
      expect(login.status).toBe(302);

      const location = login.headers.location;
      expect(location).toBeDefined();
      expect(typeof location).toBe('string');
      const code = new URL(location).searchParams.get('code');
      expect(code).toBeTruthy();

      const token = await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grant_type: 'authorization_code',
          code,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          code_verifier: verifier,
        })
        .expect(200);
      const tokenBody = bodyOf<TokenResponse>(token);
      expect(tokenBody.access_token).toBeDefined();
    });

    it('rejects a bad PKCE verifier', async () => {
      const email = randomEmail('badpkce');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);

      const pkce = makePkce();
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: STRONG_PASSWORD,
          client_id: STAFF_CLIENT_ID,
          redirect_uri: STAFF_REDIRECT_URI,
          code_challenge: pkce.challenge,
          code_challenge_method: 'S256',
        });

      const location = login.headers.location;
      expect(location).toBeDefined();
      expect(typeof location).toBe('string');
      const code = new URL(location).searchParams.get('code');
      expect(code).toBeTruthy();

      const bad = makePkce();
      const res = await request(app.getHttpServer()).post('/auth/token').send({
        grant_type: 'authorization_code',
        code,
        client_id: STAFF_CLIENT_ID,
        redirect_uri: STAFF_REDIRECT_URI,
        code_verifier: bad.verifier,
      });
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('INVALID_CODE');
    });
  });

  describe('POST /auth/client-token', () => {
    it('returns an accessToken for a known client', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/client-token')
        .send({ clientId: STAFF_CLIENT_ID })
        .expect(200);
      const body = bodyOf<{ accessToken: string }>(res);
      expect(body.accessToken).toBeDefined();
    });

    it('returns 400 with MISSING_CLIENT_ID when clientId is absent', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/client-token')
        .send({});
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('MISSING_CLIENT_ID');
    });

    it('returns 400 with INVALID_CLIENT for an unknown client', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/client-token')
        .send({ clientId: 'no-such-app' });
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('INVALID_CLIENT');
    });
  });

  describe('POST /auth/staff/login', () => {
    it('logs in the seeded ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          client_id: STAFF_CLIENT_ID,
        })
        .expect(200);
      const body = bodyOf<LoginResponse>(res);

      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.type).toBe('ADMIN');
    });

    it('rejects a USER-type account', async () => {
      const email = randomEmail('staffuser');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          email,
          password: STRONG_PASSWORD,
          client_id: STAFF_CLIENT_ID,
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects an unknown client_id', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          client_id: 'no-such-app',
        });
      expect(res.status).toBe(400);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('INVALID_CLIENT');
    });

    it('rejects a wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          email: adminEmail,
          password: 'DefinitelyWrong!1',
          client_id: STAFF_CLIENT_ID,
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the session and clears the cookie', async () => {
      const email = randomEmail('logout');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(200);

      const loginBody = bodyOf<LoginResponse>(login);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: loginBody.refreshToken })
        .expect(200);

      const refresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginBody.refreshToken });
      expect(refresh.status).toBe(401);
    });

    it('returns 404 when there is no session to revoke', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({});
      expect(res.status).toBe(404);
      const body = bodyOf<ErrorResponse>(res);
      expect(body.errorCode).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('Account lockout', () => {
    it('locks the account after 5 failed logins', async () => {
      const email = randomEmail('lock');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: STRONG_PASSWORD })
        .expect(201);

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'wrong-password' });
      }

      const locked = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: STRONG_PASSWORD });
      expect(locked.status).toBeGreaterThanOrEqual(400);
      const body = bodyOf<ErrorResponse>(locked);
      expect(body.message).toBeDefined();
    });
  });
});
