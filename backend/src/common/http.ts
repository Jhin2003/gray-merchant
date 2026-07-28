// Convenience error helpers so controllers stay consistent.
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorPayload } from './errors';

export const throwApiError = (
  status: HttpStatus,
  errorCode: string,
  message: string,
  details?: unknown,
): never => {
  const payload: ErrorPayload = { errorCode, message };
  if (details !== undefined) payload.details = details;
  throw new HttpException(payload, status);
};

/**
 * Use this to assert a value is defined. Throws an HTTP 500 if it is null/undefined.
 * Strict alternative to the non-null assertion operator that keeps tsc/strict happy
 * without leaking `!` into every caller.
 */
export function assertPresent<T>(
  value: T | null | undefined,
  name = 'value',
): T {
  if (value === null || value === undefined) {
    throw new HttpException(
      {
        errorCode: 'INTERNAL_MISSING_VALUE',
        message: `${name} unexpectedly missing`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return value;
}

export const zodIssuesToDetails = (
  issues: readonly {
    path: readonly (string | number | symbol)[];
    message: string;
  }[],
) =>
  issues.map((i) => ({
    field: i.path.map((p) => String(p)).join('.'),
    message: i.message,
  }));
