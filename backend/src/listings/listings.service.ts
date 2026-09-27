import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { GetListingsDto } from './dto/get-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  //create a listing
  async create(createListingDto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: createListingDto,
    });

    return listing;
  }

    //Find all listings with pagination and optional search
  async findAll({ page, limit, search }: GetListingsDto) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        card: {
          name: {
            contains: search,
            mode: 'insensitive' as const,
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
          createdAt: 'desc',
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

  //remove a listing by id
  async remove(id: number) {
    return this.prisma.listing.delete({
      where: {
        id,
      },
    });
  }

  async findOne(id: number) {
  return this.prisma.listing.findUnique({
    where: {
      id,
    },
    include: {
      card: true,
    },

  });

  
}

async update(id: number, updateData: UpdateListingDto) {
    
      const updatedListing = await this.prisma.listing.update({
        where: { id },
        data: updateData,
        // Include relations if your frontend expects the card data to be returned with the update
        include: {
          card: true, 
        },
      });

      return updatedListing;
    } 
  }
