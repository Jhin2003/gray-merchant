import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';


import { SkipThrottle } from '@nestjs/throttler';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { GetListingsDto } from './dto/get-listings.dto';

@SkipThrottle()
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  create(@Body() createListingDto: CreateListingDto) {
    console.log(createListingDto);
    return this.listingsService.create(createListingDto);
  }

  @Get()
  findAll(@Query() query: GetListingsDto) {
    return this.listingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(+id);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingsService.remove(+id);
  }
}
