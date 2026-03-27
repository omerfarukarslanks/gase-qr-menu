import { IsString, IsOptional, IsArray, IsNumber, IsInt, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Table session ID (required)' })
  @IsString()
  tableSessionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] })
  @IsString()
  status: string;
}
