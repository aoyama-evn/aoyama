import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { normalizePhone } from 'src/common/utils';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';
import { Customer } from './entities/customer.entity';

/** M-09 — Quan ly khach hang. SA-15..SA-18, va sinh ho so tu luong dat lich. */
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Khong tim thay khach hang',
      });
    }
    return customer;
  }

  async findByPhone(rawPhone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone: normalizePhone(rawPhone) } });
  }

  /**
   * BR-01 — mot so dien thoai chi co mot ho so.
   * Dung o luong dat lich cua Guest: co ho so thi tai su dung, chua co thi tao moi.
   * Khong bao gio ghi de ten cua khach da dang ky bang ten Guest vua nhap.
   */
  async findOrCreateByPhone(input: {
    phone: string;
    name: string;
    email?: string | null;
  }): Promise<Customer> {
    const phone = normalizePhone(input.phone);
    const existing = await this.repo.findOne({ where: { phone } });
    if (existing) {
      if (existing.mergedIntoId) {
        return this.findById(existing.mergedIntoId);
      }
      // Bo sung email khi ho so cu chua co, nhung giu nguyen ten da xac lap.
      if (!existing.email && input.email) {
        existing.email = input.email;
        await this.repo.save(existing);
      }
      return existing;
    }
    return this.repo.save(
      this.repo.create({
        phone,
        name: input.name,
        email: input.email ?? null,
        isGuest: true,
      }),
    );
  }

  async search(
    query: PaginationQueryDto & { keyword?: string; isGuest?: boolean; isActive?: boolean },
  ): Promise<PageDto<Customer>> {
    const qb = this.repo
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.vehicleCount', 'c.vehicles')
      .where('c.merged_into_id IS NULL');

    if (query.keyword) {
      qb.andWhere('(c.name ILIKE :kw OR c.phone ILIKE :kw OR c.email ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    if (query.isGuest !== undefined) qb.andWhere('c.is_guest = :g', { g: query.isGuest });
    if (query.isActive !== undefined) qb.andWhere('c.is_active = :a', { a: query.isActive });

    const [items, total] = await qb
      .orderBy(`c.${query.sortBy ?? 'created_at'}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async create(data: Partial<Customer> & { phone: string }): Promise<Customer> {
    const phone = normalizePhone(data.phone);
    const existing = await this.repo.findOne({ where: { phone } });
    if (existing) {
      throw new BadRequestException({
        code: 'CUSTOMER_DUPLICATE',
        message: 'So dien thoai da co ho so khach hang',
      });
    }
    return this.repo.save(this.repo.create({ ...data, phone }));
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.findById(id);
    if (data.phone) {
      const phone = normalizePhone(data.phone);
      const other = await this.repo.findOne({ where: { phone } });
      if (other && other.id !== id) {
        throw new BadRequestException({
          code: 'CUSTOMER_DUPLICATE',
          message: 'So dien thoai da thuoc ve khach hang khac',
        });
      }
      data.phone = phone;
    }
    await this.repo.update(id, data);
    return this.findById(id);
  }

  /**
   * SA-18 Gop ho so trung — FR-CUS-06, FR-CUS-07.
   * Chuyen toan bo xe sang ho so giu lai, danh dau ho so nguon da gop.
   * Lich hen va phieu dich vu cu van tro toi ho so nguon, nen truy nguoc
   * qua mergedIntoId de khong mat lich su.
   */
  async merge(sourceId: string, targetId: string): Promise<Customer> {
    if (sourceId === targetId) {
      throw new BadRequestException({
        code: 'MERGE_SAME_CUSTOMER',
        message: 'Khong the gop mot ho so voi chinh no',
      });
    }
    const source = await this.findById(sourceId);
    const target = await this.findById(targetId);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Vehicle)
        .update({ customerId: source.id }, { customerId: target.id });

      if (!target.email && source.email) target.email = source.email;
      if (!target.address && source.address) target.address = source.address;
      if (source.internalNote) {
        target.internalNote = [target.internalNote, source.internalNote].filter(Boolean).join('\n');
      }
      // Ho so da dang ky thang ho so Guest khi quyet dinh trang thai cuoi.
      target.isGuest = target.isGuest && source.isGuest;
      await manager.getRepository(Customer).save(target);

      source.mergedIntoId = target.id;
      source.isActive = false;
      await manager.getRepository(Customer).save(source);
    });

    return this.findById(targetId);
  }

  /** Goi y cac cap ho so nghi trung — FR-CUS-06, hien tai SA-18. */
  async findDuplicateCandidates(limit = 50): Promise<{ left: Customer; right: Customer }[]> {
    const rows = await this.repo
      .createQueryBuilder('c')
      .where('c.merged_into_id IS NULL')
      .orderBy('c.name', 'ASC')
      .take(500)
      .getMany();

    const pairs: { left: Customer; right: Customer }[] = [];
    const byName = new Map<string, Customer[]>();
    for (const row of rows) {
      const key = row.name.trim().toLowerCase();
      byName.set(key, [...(byName.get(key) ?? []), row]);
    }
    for (const group of byName.values()) {
      for (let i = 0; i < group.length - 1 && pairs.length < limit; i += 1) {
        for (let j = i + 1; j < group.length && pairs.length < limit; j += 1) {
          pairs.push({ left: group[i], right: group[j] });
        }
      }
    }
    return pairs;
  }
}
