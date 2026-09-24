import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesModule } from 'src/modules/vehicles/vehicles.module';
import { AdminCustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

/** M-09 — Quan ly khach hang. */
@Module({
  imports: [TypeOrmModule.forFeature([Customer]), forwardRef(() => VehiclesModule)],
  controllers: [AdminCustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
