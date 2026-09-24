import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersModule } from 'src/modules/work-orders/work-orders.module';
import { Payment } from './entities/payment.entity';
import { AdminPaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

/** M-13 — Thanh toan. */
@Module({
  imports: [TypeOrmModule.forFeature([Payment]), WorkOrdersModule],
  controllers: [AdminPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
