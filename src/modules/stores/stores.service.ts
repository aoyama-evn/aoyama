import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { StoreBusinessHour } from './entities/store-business-hour.entity';
import { StoreHoliday } from './entities/store-holiday.entity';
import { TimeSlot } from './entities/time-slot.entity';

/** M-16 — Cua hang va lich lam viec. SC-05, SC-06, SA-32..SA-35. */
@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreBusinessHour)
    private readonly hourRepo: Repository<StoreBusinessHour>,
    @InjectRepository(StoreHoliday) private readonly holidayRepo: Repository<StoreHoliday>,
    @InjectRepository(TimeSlot) private readonly slotRepo: Repository<TimeSlot>,
  ) {}

  /** SC-05 — chi tra cua hang dang hoat dong cho site khach hang. */
  async findPublic(): Promise<Store[]> {
    return this.storeRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async findAll(includeInactive = false): Promise<Store[]> {
    return this.storeRepo.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepo.findOne({
      where: { id },
      relations: { businessHours: true, holidays: true, timeSlots: true },
    });
    if (!store) {
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Khong tim thay cua hang' });
    }
    return store;
  }

  async create(data: Partial<Store>): Promise<Store> {
    return this.storeRepo.save(this.storeRepo.create(data));
  }

  async update(id: string, data: Partial<Store>): Promise<Store> {
    await this.findOne(id);
    await this.storeRepo.update(id, data);
    return this.findOne(id);
  }

  /** Ngung hoat dong thay vi xoa — lich su lich hen va phieu van tham chieu toi. */
  async deactivate(id: string): Promise<Store> {
    return this.update(id, { isActive: false });
  }

  // ---- SA-34 Gio lam viec va ngay nghi ----

  async replaceBusinessHours(
    storeId: string,
    hours: Partial<StoreBusinessHour>[],
  ): Promise<StoreBusinessHour[]> {
    await this.findOne(storeId);
    await this.hourRepo.delete({ storeId });
    const rows = hours.map((h) => this.hourRepo.create({ ...h, storeId }));
    return this.hourRepo.save(rows);
  }

  async listHolidays(storeId: string, from?: string, to?: string): Promise<StoreHoliday[]> {
    const qb = this.holidayRepo
      .createQueryBuilder('h')
      .where('h.store_id = :storeId', { storeId })
      .orderBy('h.date', 'ASC');
    if (from) qb.andWhere('h.date >= :from', { from });
    if (to) qb.andWhere('h.date <= :to', { to });
    return qb.getMany();
  }

  async addHoliday(storeId: string, date: string, reason?: string): Promise<StoreHoliday> {
    await this.findOne(storeId);
    return this.holidayRepo.save(this.holidayRepo.create({ storeId, date, reason: reason ?? null }));
  }

  async removeHoliday(storeId: string, holidayId: string): Promise<void> {
    await this.holidayRepo.delete({ id: holidayId, storeId });
  }

  // ---- SA-35 Khung gio va nang luc tiep nhan ----

  async listTimeSlots(storeId: string): Promise<TimeSlot[]> {
    return this.slotRepo.find({
      where: { storeId },
      order: { weekday: 'ASC', startTime: 'ASC' },
    });
  }

  async replaceTimeSlots(storeId: string, slots: Partial<TimeSlot>[]): Promise<TimeSlot[]> {
    await this.findOne(storeId);
    await this.slotRepo.delete({ storeId });
    const rows = slots.map((s) => this.slotRepo.create({ ...s, storeId }));
    return this.slotRepo.save(rows);
  }

  async isHoliday(storeId: string, date: string): Promise<boolean> {
    const count = await this.holidayRepo.count({ where: { storeId, date } });
    return count > 0;
  }

  async getBusinessHour(storeId: string, weekday: number): Promise<StoreBusinessHour | null> {
    return this.hourRepo.findOne({ where: { storeId, weekday } });
  }

  async getSlotsForWeekday(storeId: string, weekday: number): Promise<TimeSlot[]> {
    return this.slotRepo.find({
      where: { storeId, weekday, isActive: true },
      order: { startTime: 'ASC' },
    });
  }
}
