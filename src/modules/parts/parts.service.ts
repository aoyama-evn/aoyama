import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { Part } from './entities/part.entity';

/** M-11 (phan danh muc) — FR-PRT-01..08. SA-25, SA-26, SA-27. */
@Injectable()
export class PartsService {
  constructor(@InjectRepository(Part) private readonly repo: Repository<Part>) {}

  async findById(id: string): Promise<Part> {
    const part = await this.repo.findOne({ where: { id } });
    if (!part) {
      throw new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Khong tim thay phu tung' });
    }
    return part;
  }

  async search(
    query: PaginationQueryDto & {
      keyword?: string;
      category?: string;
      maker?: string;
      isActive?: boolean;
      compatibleWith?: string;
    },
  ): Promise<PageDto<Part>> {
    const qb = this.repo.createQueryBuilder('p');

    if (query.keyword) {
      qb.andWhere('(p.code ILIKE :kw OR p.name::text ILIKE :kw OR p.maker_part_no ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    if (query.category) qb.andWhere('p.category = :category', { category: query.category });
    if (query.maker) qb.andWhere('p.maker ILIKE :maker', { maker: `%${query.maker}%` });
    if (query.isActive !== undefined) qb.andWhere('p.is_active = :active', { active: query.isActive });
    // Loc phu tung hop voi mot dong xe — ho tro buoc chon phu tung o SA-11 va SA-12.
    if (query.compatibleWith) {
      qb.andWhere('p.compatible_vehicles::text ILIKE :cv', { cv: `%${query.compatibleWith}%` });
    }

    const [items, total] = await qb
      .orderBy('p.code', 'ASC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async create(data: Partial<Part> & { code: string }): Promise<Part> {
    const existing = await this.repo.findOne({ where: { code: data.code }, withDeleted: true });
    if (existing) {
      throw new BadRequestException({
        code: 'PART_DUPLICATE',
        message: 'Ma phu tung da ton tai',
      });
    }
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Part>): Promise<Part> {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }

  /** FR-PRT-14 — khong xoa cung vi phieu dich vu cu con tham chieu. */
  async deactivate(id: string): Promise<Part> {
    return this.update(id, { isActive: false });
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.category IS NOT NULL')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category);
  }
}
