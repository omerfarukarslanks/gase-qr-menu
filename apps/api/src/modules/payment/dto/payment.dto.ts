import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['CREDIT_CARD', 'CASH', 'DEBIT_CARD', 'ONLINE'] })
  @IsString()
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProcessCardPaymentDto extends CreatePaymentDto {
  @ApiProperty()
  @IsString()
  cardHolderName: string;

  @ApiProperty()
  @IsString()
  cardNumber: string;

  @ApiProperty()
  @IsString()
  expireMonth: string;

  @ApiProperty()
  @IsString()
  expireYear: string;

  @ApiProperty()
  @IsString()
  cvc: string;
}
