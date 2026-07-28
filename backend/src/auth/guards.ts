import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { throwApiError, assertPresent } from '../common/http';
import { AccessTokenPayload } from './jwt-payload';
import { UserType } from '../../generated/prisma/enums';

export const ALLOWED_TYPES_KEY = 'allowedTypes';
export const AllowedTypes =
  (...types: UserType[]) =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    const metadataTarget = (descriptor?.value as object | undefined) ?? target;
    Reflect.defineMetadata(ALLOWED_TYPES_KEY, types, metadataTarget);
  };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  validate(payload: AccessTokenPayload): AccessTokenPayload {
    return payload;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<UserType[] | undefined>(
      ALLOWED_TYPES_KEY,
      context.getHandler(),
    );
    if (!required || required.length === 0) return true;

    const http = context.switchToHttp();
    const user = http.getRequest<{ user?: AccessTokenPayload }>().user;
    if (!user) {
      throwApiError(401, 'UNAUTHENTICATED', 'Authentication required');
    }
    const authedUser = assertPresent(user, 'authenticated user');
    if (!required.includes(authedUser.type)) {
      throwApiError(
        403,
        'FORBIDDEN',
        `Access requires one of: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
