import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { GetListingsDto } from './dto/get-listings.dto';

@Injectable()
export class ListingsService {
    constructor(private readonly prisma: PrismaService) {}




  async create(createListingDto: CreateListingDto) {
  const listing = await this.prisma.listing.create({
    data: createListingDto,
  });

  return listing;
}

async findAll({ page, limit, search }: GetListingsDto) {
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      card: {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
    }),
  };

  const [items, total] = await this.prisma.$transaction([
    this.prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        card: true,
      },
    }),

    this.prisma.listing.count({
      where,
    }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async remove(id: number) {
  return this.prisma.listing.delete({
    where: {
      id,
    },
  });
}

  findOne(id: number) {
    return `This action returns a #${id} listing`;
  }



 
}
