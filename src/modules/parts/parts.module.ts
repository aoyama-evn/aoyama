import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Part } from './entities/part.entity';
import { InventoryService } from './inventory.service';
import { AdminPartsController } from './parts.controller';
import { PartsService } from './parts.service';

/** M-11 — Phu tung va ton kho. */
@Module({
  imports: [TypeOrmModule.forFeature([Part, Inventory, InventoryTransaction])],
  controllers: [AdminPartsController],
  providers: [PartsService, InventoryService],
  exports: [PartsService, InventoryService],
})
export class PartsModule {}
