import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScryfallService } from './scryfall/scryfall.service';
import { CardsService } from './cards/cards.service';
import { CardsModule } from './cards/cards.module';
import { ScryfallModule } from './scryfall/scryfall.module';
import { ListingsModule } from './listings/listings.module';

@Module({
  imports: [
    CardsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      // E2E tests exercise endpoint behavior repeatedly from one local IP.
      // Production and development still use the limits below.
      skipIf: () => process.env.NODE_ENV === 'test',
      throttlers: [
        { name: 'short', ttl: 60_000, limit: 100 }, // 100 req / min (global)
        { name: 'login', ttl: 15 * 60_000, limit: 10 },
        { name: 'register', ttl: 60 * 60_000, limit: 5 },
      ],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    ScryfallModule,
    ListingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ScryfallService,
    CardsService,
  ],
})
export class AppModule {}
