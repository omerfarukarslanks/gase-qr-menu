import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadQueryDto {
  @ApiPropertyOptional({ enum: ['product', 'category', 'store', 'organization', 'model3d'] })
  @IsOptional()
  @IsString()
  folder?: string;
}
