import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 'Table 1' })
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class OpenSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
