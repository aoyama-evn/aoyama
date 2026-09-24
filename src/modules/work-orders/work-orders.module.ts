import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from 'src/modules/bookings/bookings.module';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { PartsModule } from 'src/modules/parts/parts.module';
import { VehiclesModule } from 'src/modules/vehicles/vehicles.module';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderItem } from './entities/work-order-item.entity';
import { WorkOrderPart } from './entities/work-order-part.entity';
import { WorkOrderPhoto } from './entities/work-order-photo.entity';
import { WorkOrderStatusHistory } from './entities/work-order-status-history.entity';
import { AdminWorkOrdersController, PublicWorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

/** M-06 — Phieu dich vu. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      WorkOrderItem,
      WorkOrderPart,
      WorkOrderPhoto,
      WorkOrderStatusHistory,
    ]),
    forwardRef(() => BookingsModule),
    CustomersModule,
    VehiclesModule,
    PartsModule,
    NotificationsModule,
  ],
  controllers: [PublicWorkOrdersController, AdminWorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
