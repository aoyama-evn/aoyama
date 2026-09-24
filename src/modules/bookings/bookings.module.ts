import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from 'src/modules/catalog/catalog.module';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { StoresModule } from 'src/modules/stores/stores.module';
import { VehiclesModule } from 'src/modules/vehicles/vehicles.module';
import { AvailabilityService } from './availability.service';
import {
  AdminBookingsController,
  MyBookingsController,
  PublicBookingsController,
} from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingService } from './entities/booking-service.entity';
import { BookingStatusHistory } from './entities/booking-status-history.entity';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

/** M-04 Dat lich va M-05 Ma QR — hai module nghiep vu gan chat nen o chung. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingService, BookingStatusHistory]),
    forwardRef(() => CustomersModule),
    forwardRef(() => VehiclesModule),
    StoresModule,
    CatalogModule,
    NotificationsModule,
  ],
  controllers: [
    PublicBookingsController,
    MyBookingsController,
    AdminBookingsController,
    QrController,
  ],
  providers: [BookingsService, AvailabilityService, QrService],
  exports: [BookingsService, AvailabilityService, QrService],
})
export class BookingsModule {}
