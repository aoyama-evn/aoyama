import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from 'src/modules/ai/ai.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BookingsModule } from 'src/modules/bookings/bookings.module';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { VehiclesModule } from 'src/modules/vehicles/vehicles.module';
import { SchedulerService } from './scheduler.service';

/** Tien trinh nen: nhac lich, danh dau khach khong den, nhac ky bao duong, don dep. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    BookingsModule,
    CustomersModule,
    VehiclesModule,
    NotificationsModule,
    AuthModule,
    AiModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
