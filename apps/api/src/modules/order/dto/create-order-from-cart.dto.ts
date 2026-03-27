import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderFromCartDto {
  @ApiProperty({ description: 'Redis cart session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Table session ID' })
  @IsString()
  tableSessionId: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
