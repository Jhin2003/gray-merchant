import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
// Ensure this path matches your custom Prisma output location
import { PaymentMethod, ShippingMode } from '../../../generated/prisma/client';

export class OrderItemDto {
  @IsNumber()
  @Min(1)
  listingId!: number; // <-- Add ! here

  @IsNumber()
  @Min(1)
  quantity!: number; // <-- Add ! here

  @IsNumber()
  @Min(0)
  priceAtPurchase!: number; // <-- Add ! here
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  lastName!: string; // <-- Add ! here

  @IsEmail()
  email!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  phone!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  streetAddress!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  barangay!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  city!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  province!: string; // <-- Add ! here

  @IsString()
  @IsNotEmpty()
  postalCode!: string; // <-- Add ! here

  @IsEnum(PaymentMethod, { message: 'Invalid payment method selected' })
  paymentMethod!: PaymentMethod; // <-- Add ! here

  @IsEnum(ShippingMode, { message: 'Invalid shipping mode selected' })
  shippingMode!: ShippingMode; // <-- Add ! here

  @IsNumber()
  @Min(0)
  subtotal!: number; // <-- Add ! here

  @IsNumber()
  @Min(0)
  shippingFee!: number; // <-- Add ! here

  @IsNumber()
  @Min(0)
  total!: number; // <-- Add ! here

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[]; // <-- Add ! here

  @IsString()
  @IsOptional()
  userId?: string; // (Optional properties with '?' don't need the '!')
}
