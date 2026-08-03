import { Module } from '@nestjs/common';
import { ScryfallService } from './scryfall.service';
import { ScryfallController } from './scryfall.controller';

@Module({
  controllers: [ScryfallController],
  providers: [ScryfallService],
})
export class ScryfallModule {}
