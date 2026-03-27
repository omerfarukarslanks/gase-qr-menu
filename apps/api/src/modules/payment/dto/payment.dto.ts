import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['CREDIT_CARD', 'CASH', 'ONLINE'] })
  @IsString()
  method: string;

  @ApiPropertyOptional({ default: 'TRY' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class Initiate3DSecureDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'URL to redirect after 3D Secure verification' })
  @IsString()
  callbackUrl: string;

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

  @ApiPropertyOptional({ default: 'TRY' })
  @IsOptional()
  @IsString()
  currency?: string;

  // Buyer info
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerSurname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerIp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerAddress?: string;
}

export class Complete3DSecureCallbackDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty({ enum: ['success', 'failure'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mdStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;
}
