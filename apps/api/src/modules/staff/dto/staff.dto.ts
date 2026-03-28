import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreRole } from '@gase/database';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'cmn-store-id' })
  @IsString()
  storeId: string;

  @ApiProperty({ example: 'Ahmet Yilmaz' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'staff@gase.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Str0ngP@ssw0rd' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ enum: StoreRole, example: StoreRole.WAITER })
  @IsEnum(StoreRole)
  role: StoreRole;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'Ahmet Yilmaz' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'staff@gase.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Str0ngP@ssw0rd' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: StoreRole, example: StoreRole.STAFF })
  @IsOptional()
  @IsEnum(StoreRole)
  role?: StoreRole;
}

export class UpdateStaffStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
