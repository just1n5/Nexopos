import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceDianService } from './invoice-dian.service';
import { InvoiceDianController } from './invoice-dian.controller';
import { InvoiceDian } from './entities/invoice-dian.entity';
import { DianResolution } from './entities/dian-resolution.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceDian, DianResolution])
  ],
  controllers: [InvoiceDianController],
  providers: [InvoiceDianService],
  exports: [InvoiceDianService]
})
export class InvoiceDianModule {}
