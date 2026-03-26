import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitService } from './unit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a unit' })
  create(@Body() dto: { name: string; abbreviation: string; storeId: string }) {
    return this.unitService.create(dto);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List units for a store' })
  findAll(@Param('storeId') storeId: string) {
    return this.unitService.findAll(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update unit' })
  update(@Param('id') id: string, @Body() dto: { name?: string; abbreviation?: string }) {
    return this.unitService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete unit' })
  remove(@Param('id') id: string) {
    return this.unitService.remove(id);
  }
}
