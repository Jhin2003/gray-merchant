import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScryfallService } from './scryfall/scryfall.service';
import { CardsService } from './cards/cards.service';
import { CardsModule } from './cards/cards.module';

@Module({
  imports: [CardsModule],
  controllers: [AppController],
  providers: [AppService, ScryfallService, CardsService],
})
export class AppModule {}
