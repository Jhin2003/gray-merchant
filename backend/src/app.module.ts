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
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    CardsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 100000 }, // 100 req / min (global)
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    ScryfallModule,
    ListingsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ScryfallService,
    CardsService,
   
  ],
})
export class AppModule {}
