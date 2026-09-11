import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthJwtModule } from './auth-jwt.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './guards';

@Module({
  imports: [ConfigModule, AuthJwtModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
