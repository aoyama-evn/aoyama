import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { WorkOrdersModule } from 'src/modules/work-orders/work-orders.module';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { AdminQuotationsController, PublicQuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

/** M-07 — Bao gia. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation, QuotationItem]),
    forwardRef(() => WorkOrdersModule),
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [PublicQuotationsController, AdminQuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
