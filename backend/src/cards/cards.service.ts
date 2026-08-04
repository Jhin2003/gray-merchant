import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardSearchResponseDto } from './dto/card-search.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string): Promise<CardSearchResponseDto[]> {
    return this.prisma.card.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        scryfallId: true,
        name: true,
        setName: true,
        imageUrl: true,
      },
    });
  }
}