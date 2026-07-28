// Helpers for cookie parsing / session cookie management.
// Mirrors authflow's helpers.js but adapted for NestJS env config.
export const AUTH_SESSION_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || 'auth_session';

export const parseCookies = (cookieHeader = ''): Record<string, string> => {
  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((cookies, pair) => {
      const [name, ...rest] = pair.split('=');
      if (!name) return cookies;
      cookies[name.trim()] = decodeURIComponent((rest || []).join('=').trim());
      return cookies;
    }, {});
};

export const getRefreshTokenFromRequest = (req: {
  headers: { cookie?: string };
}): string | undefined => {
  const cookies = parseCookies(req.headers?.cookie ?? '');
  return cookies[AUTH_SESSION_COOKIE_NAME];
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
  const secure = process.env.NODE_ENV === 'production';
  const allowCrossSite =
    !!process.env.AUTH_COOKIE_DOMAIN ||
    process.env.ALLOW_CROSS_SITE_SSO === 'true';
  const sameSite: 'lax' | 'none' | 'strict' = allowCrossSite ? 'none' : 'lax';
  const opts: SessionCookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  if (process.env.AUTH_COOKIE_DOMAIN) {
    opts.domain = process.env.AUTH_COOKIE_DOMAIN;
  }
  return opts;
};
