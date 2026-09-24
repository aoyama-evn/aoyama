import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Truong sap xep' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PageMetaDto {
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
  hasPrev!: boolean;
  hasNext!: boolean;
}

export class PageDto<T> {
  items!: T[];
  meta!: PageMetaDto;

  constructor(items: T[], total: number, query: PaginationQueryDto) {
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    this.items = items;
    this.meta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasPrev: query.page > 1,
      hasNext: query.page < totalPages,
    };
  }
}
