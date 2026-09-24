import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Inventory } from 'src/modules/parts/entities/inventory.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { WorkOrder } from 'src/modules/work-orders/entities/work-order.entity';
import { WorkOrderPart } from 'src/modules/work-orders/entities/work-order-part.entity';
import { ExportService } from './export.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/** M-15 — Bao cao va thong ke. */
@Module({
  imports: [TypeOrmModule.forFeature([Booking, WorkOrder, WorkOrderPart, Payment, Inventory])],
  controllers: [ReportsController],
  providers: [ReportsService, ExportService],
  exports: [ReportsService],
})
export class ReportsModule {}
