import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { SettingsService } from './settings.service';
import { SystemController } from './system.controller';

/**
 * M-18 — Cau hinh va nhat ky.
 * Danh dau Global vi gan nhu moi module nghiep vu deu ghi nhat ky thao tac
 * va doc nguong cau hinh; tiem thu cong o tung cho se rat rom ra.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting, AuditLog])],
  controllers: [SystemController],
  providers: [SettingsService, AuditService],
  exports: [SettingsService, AuditService],
})
export class SystemModule {}
