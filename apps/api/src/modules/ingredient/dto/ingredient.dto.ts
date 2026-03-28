import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngredientTypeName } from '@gase/database';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Ketcap' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'cmn-store-id' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ enum: IngredientTypeName, default: IngredientTypeName.OTHER })
  @IsOptional()
  @IsEnum(IngredientTypeName)
  type?: IngredientTypeName;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: IngredientTypeName })
  @IsOptional()
  @IsEnum(IngredientTypeName)
  type?: IngredientTypeName;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}
