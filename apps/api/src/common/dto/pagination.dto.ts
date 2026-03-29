import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  get hasPagination(): boolean {
    return typeof this.page === 'number' || typeof this.limit === 'number';
  }

  get resolvedPage(): number {
    return this.page ?? DEFAULT_PAGE;
  }

  get resolvedLimit(): number {
    return this.limit ?? DEFAULT_LIMIT;
  }

  get skip(): number {
    return (this.resolvedPage - 1) * this.resolvedLimit;
  }

  get prismaPagination(): { skip: number; take: number } | Record<string, never> {
    if (!this.hasPagination) {
      return {};
    }

    return {
      skip: this.skip,
      take: this.resolvedLimit,
    };
  }

  buildMeta(total: number) {
    if (!this.hasPagination) {
      return {
        total,
        page: 1,
        limit: total,
        totalPages: total > 0 ? 1 : 0,
      };
    }

    return {
      total,
      page: this.resolvedPage,
      limit: this.resolvedLimit,
      totalPages: Math.ceil(total / this.resolvedLimit),
    };
  }
}
