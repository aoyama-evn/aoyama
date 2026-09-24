import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { ServiceType } from 'src/common/enums';
import { PriceRule } from './entities/price-rule.entity';
import { Service } from './entities/service.entity';

export interface PriceQuery {
  serviceId: string;
  storeId?: string | null;
  engineCc?: number | null;
  difficultyLevel?: number;
}

/** M-10 — Dich vu va bang gia. SC-02..SC-04, SA-22..SA-24. */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(PriceRule) private readonly priceRepo: Repository<PriceRule>,
  ) {}

  // ---- Dich vu ----

  async findPublic(type?: ServiceType): Promise<Service[]> {
    return this.serviceRepo.find({
      where: type ? { isActive: true, type } : { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async findFeatured(limit = 5): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { isActive: true, isFeatured: true },
      order: { sortOrder: 'ASC' },
      take: limit,
    });
  }

  async findBySlug(slug: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { slug, isActive: true } });
    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Khong tim thay dich vu',
      });
    }
    return service;
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { priceRules: true },
    });
    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Khong tim thay dich vu',
      });
    }
    return service;
  }

  async search(
    query: PaginationQueryDto & { keyword?: string; type?: ServiceType; isActive?: boolean },
  ): Promise<PageDto<Service>> {
    const qb = this.serviceRepo.createQueryBuilder('s');
    if (query.type) qb.andWhere('s.type = :type', { type: query.type });
    if (query.isActive !== undefined) qb.andWhere('s.is_active = :active', { active: query.isActive });
    if (query.keyword) {
      qb.andWhere('(s.code ILIKE :kw OR s.name::text ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    const [items, total] = await qb
      .orderBy('s.sort_order', 'ASC')
      .addOrderBy('s.code', 'ASC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async create(data: Partial<Service>): Promise<Service> {
    const existing = await this.serviceRepo.findOne({
      where: [{ code: data.code }, { slug: data.slug }],
      withDeleted: true,
    });
    if (existing) {
      throw new BadRequestException({
        code: 'SERVICE_DUPLICATE',
        message: 'Ma hoac duong dan dich vu da ton tai',
      });
    }
    return this.serviceRepo.save(this.serviceRepo.create(data));
  }

  async update(id: string, data: Partial<Service>): Promise<Service> {
    await this.findOne(id);
    await this.serviceRepo.update(id, data);
    return this.findOne(id);
  }

  /**
   * FR-SVC-10 — khong xoa cung dich vu da phat sinh lich su; chi an di.
   * Lich hen va phieu cu van giu ten va gia da chup lai nen khong bi anh huong.
   */
  async deactivate(id: string): Promise<Service> {
    return this.update(id, { isActive: false });
  }

  // ---- Bang gia (SA-24) ----

  async listPriceRules(serviceId?: string): Promise<PriceRule[]> {
    return this.priceRepo.find({
      where: serviceId ? { serviceId } : {},
      relations: { service: true },
      order: { serviceId: 'ASC', engineCcFrom: 'ASC' },
    });
  }

  async upsertPriceRule(data: Partial<PriceRule>): Promise<PriceRule> {
    if (data.id) {
      await this.priceRepo.update(data.id, data);
      return this.priceRepo.findOneOrFail({ where: { id: data.id } });
    }
    return this.priceRepo.save(this.priceRepo.create(data));
  }

  async deletePriceRule(id: string): Promise<void> {
    await this.priceRepo.delete(id);
  }

  /**
   * BR-36..BR-38 — chon gia ap dung.
   * Dong khop hep nhat thang: uu tien dong gan voi cua hang cu the, sau do
   * den dong co khoang dung tich hep hon. Khong co dong nao khop thi lui ve
   * basePrice cua dich vu.
   */
  async resolvePrice(query: PriceQuery): Promise<{ price: number; ruleId: string | null }> {
    const service = await this.findOne(query.serviceId);
    const today = new Date().toISOString().slice(0, 10);

    const candidates = await this.priceRepo.find({
      where: [
        { serviceId: query.serviceId, storeId: query.storeId ?? IsNull(), isActive: true },
        { serviceId: query.serviceId, storeId: IsNull(), isActive: true },
      ],
    });

    const matched = candidates
      .filter((rule) => {
        if (rule.validFrom && rule.validFrom > today) return false;
        if (rule.validTo && rule.validTo < today) return false;
        if (query.difficultyLevel && rule.difficultyLevel !== query.difficultyLevel) return false;
        if (query.engineCc != null) {
          if (rule.engineCcFrom != null && query.engineCc < rule.engineCcFrom) return false;
          if (rule.engineCcTo != null && query.engineCc > rule.engineCcTo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Dong gan cua hang cu the thang dong dung chung.
        const storeScore = Number(Boolean(b.storeId)) - Number(Boolean(a.storeId));
        if (storeScore !== 0) return storeScore;
        return rangeWidth(a) - rangeWidth(b);
      });

    if (matched.length === 0) {
      return { price: service.basePrice, ruleId: null };
    }
    return { price: matched[0].price, ruleId: matched[0].id };
  }
}

/** Khoang dung tich cang hep thi cang cu the, nen duoc uu tien. */
function rangeWidth(rule: PriceRule): number {
  const from = rule.engineCcFrom ?? 0;
  const to = rule.engineCcTo ?? Number.MAX_SAFE_INTEGER;
  return to - from;
}
