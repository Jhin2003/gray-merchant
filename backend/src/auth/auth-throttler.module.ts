import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'login', ttl: 15 * 60_000, limit: 10 },
      { name: 'register', ttl: 60 * 60_000, limit: 5 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class AuthThrottlerModule {}
