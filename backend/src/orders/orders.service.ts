import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    // 1. Extract userId alongside items so it doesn't get spread into orderData
    const { items, userId, ...orderData } = createOrderDto;

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const orderNumber = `ORD-${datePart}-${randomPart}`;

    try {
      const order = await this.prisma.order.create({
        data: {
          ...orderData,
          orderNumber,

          // 2. Conditionally connect the user if userId was provided
          ...(userId && {
            user: {
              connect: { id: userId },
            },
          }),

          items: {
            create: items.map((item) => ({
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
              listing: {
                connect: { id: item.listingId },
              },
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    } catch (error) {
      // Check if it's a standard Error object before accessing .message
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to create order: ${error.message}`,
        );
      }

      // Fallback for unknown error types
      throw new InternalServerErrorException('Failed to create order');
    }
  }
}
