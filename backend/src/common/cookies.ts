// Helpers for cookie parsing / session cookie management.
// Mirrors authflow's helpers.js but adapted for NestJS env config.
export const DEFAULT_AUTH_SESSION_COOKIE_NAME = 'auth_session';

export const getAuthSessionCookieName = (): string =>
  process.env.AUTH_COOKIE_NAME?.trim() || DEFAULT_AUTH_SESSION_COOKIE_NAME;

export const parseCookies = (cookieHeader = ''): Record<string, string> => {
  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((cookies, pair) => {
      const [name, ...rest] = pair.split('=');
      if (!name) return cookies;
      try {
        cookies[name.trim()] = decodeURIComponent(
          (rest || []).join('=').trim(),
        );
      } catch {
        // Ignore malformed cookie values instead of failing the request.
      }
      return cookies;
    }, {});
};

export const getRefreshTokenFromRequest = (req: {
  headers: { cookie?: string };
}): string | undefined => {
  const cookies = parseCookies(req.headers?.cookie ?? '');
  return cookies[getAuthSessionCookieName()];
};

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict';
  maxAge: number;
  domain?: string;
  path: string;
}

export const buildSessionCookieOptions = (): SessionCookieOptions => {
  const allowCrossSite =
    !!process.env.AUTH_COOKIE_DOMAIN ||
    process.env.ALLOW_CROSS_SITE_SSO === 'true';
  const secure = process.env.NODE_ENV === 'production' || allowCrossSite;
  const sameSite: 'lax' | 'none' | 'strict' = allowCrossSite ? 'none' : 'lax';
  const configuredTtl = Number(process.env.JWT_REFRESH_TTL_DAYS ?? '30');
  const ttlDays =
    Number.isSafeInteger(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : 30;
  const opts: SessionCookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
    path: '/',
  };
  if (process.env.AUTH_COOKIE_DOMAIN) {
    opts.domain = process.env.AUTH_COOKIE_DOMAIN;
  }
  return opts;
};
