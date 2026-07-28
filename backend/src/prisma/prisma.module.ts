// Prisma module — exposes PrismaService globally so any feature module
// can inject it without re-importing PrismaClient.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
