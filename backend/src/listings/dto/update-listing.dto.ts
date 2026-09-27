import { PartialType } from '@nestjs/mapped-types'; // Use @nestjs/swagger if you are using Swagger
import { CreateListingDto } from './create-listing.dto';

export class UpdateListingDto extends PartialType(CreateListingDto) {}