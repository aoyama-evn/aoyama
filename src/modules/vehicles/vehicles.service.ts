import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { ServiceHistory } from './entities/service-history.entity';
import { Vehicle } from './entities/vehicle.entity';

/** M-08 — Phuong tien va lich su dich vu. SC-29..SC-32, SA-19..SA-21. */
@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>,
    @InjectRepository(ServiceHistory) private readonly historyRepo: Repository<ServiceHistory>,
    @InjectRepository(MaintenanceSchedule)
    private readonly scheduleRepo: Repository<MaintenanceSchedule>,
  ) {}

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOne({ where: { id }, relations: { customer: true } });
    if (!vehicle) {
      throw new NotFoundException({ code: 'VEHICLE_NOT_FOUND', message: 'Khong tim thay xe' });
    }
    return vehicle;
  }

  /** SC-29 — xe cua khach dang dang nhap. */
  async findByCustomer(customerId: string): Promise<Vehicle[]> {
    return this.repo.find({
      where: { customerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Chan khach doc xe cua nguoi khac — NFR-SE-07. */
  async findOwnedBy(id: string, customerId: string): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    if (vehicle.customerId !== customerId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Xe khong thuoc ve tai khoan nay',
      });
    }
    return vehicle;
  }

  async search(
    query: PaginationQueryDto & { keyword?: string; customerId?: string; storeId?: string },
  ): Promise<PageDto<Vehicle>> {
    const qb = this.repo.createQueryBuilder('v').leftJoinAndSelect('v.customer', 'c');
    if (query.customerId) qb.andWhere('v.customer_id = :cid', { cid: query.customerId });
    if (query.keyword) {
      qb.andWhere(
        '(v.plate_number ILIKE :kw OR v.maker ILIKE :kw OR v.model ILIKE :kw OR c.name ILIKE :kw OR c.phone ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('v.created_at', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  /** BR-46 — bien so la khoa nghiep vu, khong duoc trung giua cac xe dang hoat dong. */
  async create(
    data: Partial<Vehicle> & { customerId: string; plateNumber: string },
  ): Promise<Vehicle> {
    const plateNumber = normalizePlate(data.plateNumber);
    const existing = await this.repo.findOne({ where: { plateNumber } });
    if (existing) {
      throw new BadRequestException({
        code: 'VEHICLE_DUPLICATE_PLATE',
        message: 'Bien so da duoc dang ky cho mot xe khac',
      });
    }
    return this.repo.save(this.repo.create({ ...data, plateNumber }));
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    await this.findById(id);
    if (data.plateNumber) {
      const plateNumber = normalizePlate(data.plateNumber);
      const other = await this.repo.findOne({ where: { plateNumber } });
      if (other && other.id !== id) {
        throw new BadRequestException({
          code: 'VEHICLE_DUPLICATE_PLATE',
          message: 'Bien so da duoc dang ky cho mot xe khac',
        });
      }
      data.plateNumber = plateNumber;
    }
    await this.repo.update(id, data);
    return this.findById(id);
  }

  /** FR-VEH-07 — xoa mem de lich su dich vu con tra cuu duoc. */
  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findByPlate(plateNumber: string): Promise<Vehicle | null> {
    return this.repo.findOne({
      where: { plateNumber: normalizePlate(plateNumber) },
      relations: { customer: true },
    });
  }

  /** Cap nhat so km khi tiep nhan xe — chi tang, khong bao gio giam (BR-19). */
  async updateOdometer(id: string, odometer: number): Promise<void> {
    const vehicle = await this.findById(id);
    if (vehicle.currentOdometer == null || odometer > vehicle.currentOdometer) {
      await this.repo.update(id, { currentOdometer: odometer });
    }
  }

  // ---- Lich su dich vu (SC-31, SA-20) ----

  async listHistory(
    vehicleId: string,
    query: PaginationQueryDto,
  ): Promise<PageDto<ServiceHistory>> {
    const [items, total] = await this.historyRepo.findAndCount({
      where: { vehicleId },
      order: { servicedAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return new PageDto(items, total, query);
  }

  async addHistory(data: Partial<ServiceHistory>): Promise<ServiceHistory> {
    return this.historyRepo.save(this.historyRepo.create(data));
  }

  // ---- Lich bao duong de xuat (AI-05, FR-NOT-05) ----

  async upsertSchedule(data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    return this.scheduleRepo.save(this.scheduleRepo.create(data));
  }

  async findDueSchedules(onOrBefore: string): Promise<MaintenanceSchedule[]> {
    return this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.vehicle', 'v')
      .leftJoinAndSelect('v.customer', 'c')
      .where('s.due_date <= :date', { date: onOrBefore })
      .andWhere('s.is_notified = false')
      .andWhere('s.is_done = false')
      .getMany();
  }

  async markScheduleNotified(id: string): Promise<void> {
    await this.scheduleRepo.update(id, { isNotified: true, notifiedAt: new Date() });
  }
}

/** Bo khoang trang thua va dua ve chu hoa de so sanh bien so on dinh. */
function normalizePlate(plate: string): string {
  return plate.trim().replace(/\s+/g, ' ').toUpperCase();
}
