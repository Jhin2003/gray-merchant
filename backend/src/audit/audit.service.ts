import type { Prisma } from '../../generated/prisma/client';

// Mirrors authflow's audit log helper, but Prisma + NestJS-flavored.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILURE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'STAFF_LOGIN_SUCCESS'
  | 'STAFF_LOGIN_FAILURE'
  | 'ADMIN_LOGIN_SUCCESS'
  | 'ADMIN_LOGIN_FAILURE'
  | 'TOKEN_REFRESH'
  | 'LOGOUT'
  | 'AUTH_FAILURE'
  | 'ACCOUNT_LOCKED'
  | 'CLIENT_TOKEN_ISSUED'
  | 'APP_AUTH_REQUEST'
  | 'APP_AUTH_GRANTED';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: AuditAction,
    payload: {
      userId?: string | null;
      ipAddress?: string | null;
      meta?: Record<string, unknown> | null;
    } = {},
  ): Promise<void> {
    try {
      const metaInput: Prisma.InputJsonValue | undefined =
        payload.meta == null
          ? undefined
          : (payload.meta as Prisma.InputJsonValue);
      await this.prisma.auditLog.create({
        data: {
          action,
          userId: payload.userId ?? null,
          ipAddress: payload.ipAddress ?? null,
          meta: metaInput,
        },
      });
    } catch (err) {
      // Audit log failures should not block the request flow.

      console.error('auditLog error:', (err as Error)?.message);
    }
  }
}
