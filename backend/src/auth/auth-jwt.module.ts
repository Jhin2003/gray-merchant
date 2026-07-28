// JWT helper module so AuthService can sign tokens.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as
          number | `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  exports: [JwtModule],
})
export class AuthJwtModule {}
