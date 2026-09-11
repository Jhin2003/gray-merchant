import { UserType } from '../../generated/prisma/enums';

export interface AccessTokenPayload {
  userId: string;
  type: UserType;
  roleId: number | null;
  jti?: string;
  iat?: number;
  exp?: number;
}
