import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';

import { SkipThrottle } from '@nestjs/throttler';

import { GetListingsDto } from './dto/get-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@SkipThrottle()
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() query: GetListingsDto) {
    return this.listingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(Number(id));
  }

  @Post()
  create(@Body() createListingDto: CreateListingDto) {
    console.log(createListingDto);
    return this.listingsService.create(createListingDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.listingsService.remove(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, updateListingDto);
  }
}
