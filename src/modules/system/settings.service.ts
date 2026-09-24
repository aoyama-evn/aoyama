import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

/**
 * Tham so he thong — FR-SYS-01, FR-SYS-02.
 * Doc tu CSDL truoc, lui ve bien moi truong khi chua co ban ghi. Gia tri duoc
 * cache trong bo nho va nap lai sau moi lan ghi de khong ban CSDL o duong nong.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, unknown>();

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    try {
      const rows = await this.repo.find();
      this.cache = new Map(rows.map((r) => [r.key, r.value]));
    } catch (error) {
      // Khi chua chay migration thi bang chua ton tai — van cho ung dung khoi dong.
      this.logger.warn('Chua doc duoc bang system_settings, dung gia tri mac dinh');
    }
  }

  /** Lay tham so; fallbackConfigPath tro toi khoa trong @nestjs/config. */
  get<T>(key: string, fallbackConfigPath?: string, fallbackValue?: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    if (fallbackConfigPath) {
      const fromConfig = this.config.get<T>(fallbackConfigPath);
      if (fromConfig !== undefined) return fromConfig;
    }
    return fallbackValue as T;
  }

  getNumber(key: string, fallbackConfigPath?: string, fallbackValue = 0): number {
    const raw = this.get<unknown>(key, fallbackConfigPath, fallbackValue);
    const parsed = typeof raw === 'string' ? Number(raw) : (raw as number);
    return Number.isFinite(parsed) ? parsed : fallbackValue;
  }

  getBoolean(key: string, fallbackConfigPath?: string, fallbackValue = false): boolean {
    const raw = this.get<unknown>(key, fallbackConfigPath, fallbackValue);
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return raw === 'true';
    return fallbackValue;
  }

  async findAll(group?: string): Promise<SystemSetting[]> {
    return this.repo.find({
      where: group ? { group } : {},
      order: { group: 'ASC', key: 'ASC' },
    });
  }

  async upsert(key: string, value: unknown, updatedById?: string): Promise<SystemSetting> {
    let row = await this.repo.findOne({ where: { key } });
    if (!row) {
      row = this.repo.create({ key, value, valueType: inferType(value) });
    } else {
      row.value = value;
    }
    row.updatedById = updatedById ?? null;
    const saved = await this.repo.save(row);
    this.cache.set(key, saved.value);
    return saved;
  }

  async upsertMany(
    entries: { key: string; value: unknown }[],
    updatedById?: string,
  ): Promise<void> {
    for (const entry of entries) {
      await this.upsert(entry.key, entry.value, updatedById);
    }
  }
}

function inferType(value: unknown): string {
  if (typeof value === 'number') return 'NUMBER';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'object' && value !== null) return 'JSON';
  return 'STRING';
}

/** Khoa tham so dung xuyen suot he thong — tranh go chuoi tu do rai rac. */
export const SETTING_KEYS = {
  BOOKING_CANCEL_CUTOFF_HOURS: 'booking.cancelCutoffHours',
  BOOKING_RESCHEDULE_CUTOFF_HOURS: 'booking.rescheduleCutoffHours',
  BOOKING_MAX_ADVANCE_DAYS: 'booking.maxAdvanceDays',
  BOOKING_REMINDER_HOURS_BEFORE: 'booking.reminderHoursBefore',
  BOOKING_NO_SHOW_AFTER_HOURS: 'booking.noShowAfterHours',
  BOOKING_REQUIRE_OTP_FOR_GUEST: 'booking.requireOtpForGuest',
  TAX_RATE_PERCENT: 'pricing.taxRatePercent',
  MAINTENANCE_DEFAULT_INTERVAL_MONTHS: 'maintenance.defaultIntervalMonths',
  MAINTENANCE_DEFAULT_INTERVAL_KM: 'maintenance.defaultIntervalKm',
  MAINTENANCE_REMINDER_DAYS_BEFORE: 'maintenance.reminderDaysBefore',
  AI_MEDIA_RETENTION_DAYS: 'ai.mediaRetentionDays',
  MAINTENANCE_MODE: 'system.maintenanceMode',
} as const;
