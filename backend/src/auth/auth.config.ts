import type { ConfigService } from '@nestjs/config';

export const DEVELOPMENT_JWT_SECRET = 'dev-secret';

export function resolveJwtSecret(config: ConfigService): string {
  const configured = config.get<string>('JWT_SECRET')?.trim();
  if (configured) return configured;

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return DEVELOPMENT_JWT_SECRET;
}

export function positiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function accessTokenTtl(config: ConfigService): string {
  const ttl = config.get<string>('JWT_ACCESS_TTL')?.trim() || '15m';
  if (!/^[1-9]\d*(s|m|h|d)$/.test(ttl)) {
    throw new Error('JWT_ACCESS_TTL must use the format <number>s|m|h|d');
  }
  return ttl;
}

export function accessTokenTtlSeconds(config: ConfigService): number {
  const ttl = accessTokenTtl(config);
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  if (!match) throw new Error('Invalid JWT_ACCESS_TTL');

  const amount = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;
  return amount * multipliers[match[2] as keyof typeof multipliers];
}
