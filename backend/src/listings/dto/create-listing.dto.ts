import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateListingDto {
  @IsInt()
  cardId!: number;

  @IsInt()
  stock!: number;

  @IsNumber()
  price!: number;

  @IsString()
  condition!: string;

  @IsString()
  language!: string;

  @IsBoolean()
  isFoil!: boolean;
}
