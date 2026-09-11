import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import {
  accessTokenTtlSeconds,
  DEVELOPMENT_JWT_SECRET,
  positiveInteger,
  resolveJwtSecret,
} from './auth.config';
import { loginSchema } from './dto/login.dto';
import { OptionalJwtAuthGuard } from './guards';

describe('auth configuration and validation', () => {
  it('refuses to use the development JWT secret in production', () => {
    const config = new ConfigService({ NODE_ENV: 'production' });
    expect(() => resolveJwtSecret(config)).toThrow(
      'JWT_SECRET is required in production',
    );
  });

  it('uses an explicit JWT secret and only falls back outside production', () => {
    expect(
      resolveJwtSecret(
        new ConfigService({ NODE_ENV: 'production', JWT_SECRET: 'safe' }),
      ),
    ).toBe('safe');
    expect(resolveJwtSecret(new ConfigService({ NODE_ENV: 'test' }))).toBe(
      DEVELOPMENT_JWT_SECRET,
    );
  });

  it('parses access-token TTLs and positive integer settings', () => {
    expect(
      accessTokenTtlSeconds(new ConfigService({ JWT_ACCESS_TTL: '2h' })),
    ).toBe(7_200);
    expect(positiveInteger('7', 5, 'LIMIT')).toBe(7);
    expect(() => positiveInteger('0', 5, 'LIMIT')).toThrow(
      'LIMIT must be a positive integer',
    );
  });

  it('accepts any non-empty password during login', () => {
    expect(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'legacy-password',
      }).success,
    ).toBe(true);
  });

  it('requires complete OAuth and PKCE parameter pairs', () => {
    expect(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password',
        client_id: 'client',
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password',
        client_id: 'client',
        redirect_uri: 'http://localhost/callback',
        code_challenge_method: 'S256',
      }).success,
    ).toBe(false);
  });

  it('rejects malformed optional bearer tokens', () => {
    const guard = new OptionalJwtAuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer malformed' },
        }),
      }),
    } as ExecutionContext;

    expect(() =>
      guard.handleRequest(null, undefined, new Error('jwt malformed'), context),
    ).toThrow(HttpException);
  });
});
