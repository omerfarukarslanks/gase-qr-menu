import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CallWaiterDto {
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Table ID' })
  @IsString()
  tableId: string;

  @ApiPropertyOptional({ description: 'Table name for display' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: 'Optional message from customer' })
  @IsOptional()
  @IsString()
  message?: string;
}
