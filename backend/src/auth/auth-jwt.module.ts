// JWT helper module so AuthService can sign tokens.
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { accessTokenTtl, resolveJwtSecret } from './auth.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: {
          expiresIn: accessTokenTtl(config) as `${number}${
            's' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthJwtModule {}
