import { Controller, Get, Query } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardSearchResponseDto } from './dto/card-search.dto';
import { SkipThrottle } from '@nestjs/throttler';
@SkipThrottle()
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('search')
  async search(
    @Query('q') query: string,
  ): Promise<CardSearchResponseDto[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.cardsService.search(query.trim());
  }
}