import { UserType } from '../../generated/prisma/enums';

export interface AccessTokenPayload {
  userId: string;
  type: UserType;
  roleId: number | null;
  iat?: number;
  exp?: number;
}
