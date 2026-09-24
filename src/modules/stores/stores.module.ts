import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreBusinessHour } from './entities/store-business-hour.entity';
import { StoreHoliday } from './entities/store-holiday.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { AdminStoresController, PublicStoresController } from './stores.controller';
import { StoresService } from './stores.service';

/** M-16 — Cua hang va lich lam viec. */
@Module({
  imports: [TypeOrmModule.forFeature([Store, StoreBusinessHour, StoreHoliday, TimeSlot])],
  controllers: [PublicStoresController, AdminStoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
