import { Controller, Post } from '@nestjs/common';
import { ScryfallService } from './scryfall.service';

@Controller('scryfall')
export class ScryfallController {
  constructor(private readonly scryfallService: ScryfallService) {}

  @Post('sync')
  async syncCards() {
    return this.scryfallService.syncCards();
  }
}