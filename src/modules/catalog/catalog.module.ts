import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCatalogController, PublicCatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PriceRule } from './entities/price-rule.entity';
import { Service } from './entities/service.entity';

/** M-10 — Dich vu va bang gia. */
@Module({
  imports: [TypeOrmModule.forFeature([Service, PriceRule])],
  controllers: [PublicCatalogController, AdminCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
