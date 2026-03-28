import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PublicMenuFiltersDto {
  @ApiPropertyOptional({ example: 'tr', description: 'Language code' })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search in product names/descriptions' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Comma-separated allergen codes to exclude (e.g. "GLUTEN,DAIRY")',
  })
  @IsOptional()
  @IsString()
  excludeAllergens?: string;

  @ApiPropertyOptional({ description: 'Table ID coming from scanned QR' })
  @IsOptional()
  @IsString()
  table?: string;
}
