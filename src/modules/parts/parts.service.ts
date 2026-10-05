import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { Language, SUPPORTED_LANGUAGES } from 'src/common/enums';
import { I18nText } from 'src/common/types';
import { fillTranslations, formatPartCode, partCodePrefix } from 'src/common/utils';
import { Part } from './entities/part.entity';

/** Postgres bao trung khoa duy nhat bang ma 23505. */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

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
    if (query.isActive !== undefined)
      qb.andWhere('p.is_active = :active', { active: query.isActive });
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

  async create(data: Partial<Part>): Promise<Part> {
    const payload = { ...data, name: this.translateName(data.name) };

    if (payload.code) {
      const existing = await this.repo.findOne({ where: { code: payload.code }, withDeleted: true });
      if (existing) {
        throw new BadRequestException({
          code: 'PART_DUPLICATE',
          message: 'Ma phu tung da ton tai',
        });
      }
      return this.repo.save(this.repo.create(payload as Partial<Part>));
    }

    /**
     * Khong gui ma thi he thong tu sinh — SA-26.
     *
     * Hai nguoi cung bam Luu mot luc co the cung nhin thay so thu tu cuoi
     * giong nhau; chi so duy nhat tren cot code se chan nguoi ve sau. Bat
     * dung loi do roi lay so ke tiep thay vi bao loi ra man hinh.
     */
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = await this.nextCode(payload.category);
      try {
        return await this.repo.save(this.repo.create({ ...payload, code } as Partial<Part>));
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 4) throw error;
      }
    }
    // Khong toi duoc: vong lap o tren hoac tra ve hoac nem ra.
    throw new BadRequestException({ code: 'PART_CODE_FAILED', message: 'Khong sinh duoc ma phu tung' });
  }

  async update(id: string, data: Partial<Part>): Promise<Part> {
    await this.findById(id);
    const payload = data.name === undefined ? data : { ...data, name: this.translateName(data.name) };
    await this.repo.update(id, payload);
    return this.findById(id);
  }

  /**
   * Dien not hai thu tieng con lai cho ten phu tung.
   *
   * Man hinh chi gui mot o: thu tieng nhan vien dang dung. Neu goi den day
   * voi nhieu hon mot o — ban ghi cu, hoac ai do goi thang API va da dich
   * san — thi giu nguyen, khong de ban may dich de len ban nguoi viet.
   */
  private translateName(name?: I18nText | null): I18nText | undefined {
    if (!name) return undefined;
    const filled = SUPPORTED_LANGUAGES.filter((lang) => (name[lang] ?? '').trim());
    if (filled.length !== 1) return name;
    const source = filled[0] as Language;
    return fillTranslations(name[source] as string, source);
  }

  /** So ke tiep trong nhom — xem formatPartCode. */
  private async nextCode(category?: string | null): Promise<string> {
    const prefix = partCodePrefix(category);
    const row = await this.repo
      .createQueryBuilder('p')
      .withDeleted()
      .select("max(nullif(regexp_replace(p.code, '^.*-', ''), '')::int)", 'max')
      .where('p.code LIKE :like', { like: `${prefix}-%` })
      // Chi lay ma dung khuon da sinh; ma nguoi tu dat ngay xua khong tinh.
      .andWhere("p.code ~ :shape", { shape: `^${prefix}-[0-9]+$` })
      .getRawOne<{ max: string | null }>();
    return formatPartCode(category, Number(row?.max ?? 0) + 1);
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
