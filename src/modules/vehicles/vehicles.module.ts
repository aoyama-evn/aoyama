import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { ServiceHistory } from './entities/service-history.entity';
import { Vehicle } from './entities/vehicle.entity';
import { AdminVehiclesController, MyVehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

/** M-08 — Phuong tien va lich su dich vu. */
@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, ServiceHistory, MaintenanceSchedule])],
  controllers: [MyVehiclesController, AdminVehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
