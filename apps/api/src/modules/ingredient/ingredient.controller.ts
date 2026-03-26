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
import { IngredientService } from './ingredient.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  @ApiOperation({ summary: 'Create an ingredient' })
  create(@Body() dto: {
    name: string;
    storeId: string;
    unitId?: string;
    currentStock?: number;
    lowStockThreshold?: number;
    cost?: number;
  }) {
    return this.ingredientService.create(dto);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List ingredients for a store' })
  findAll(@Param('storeId') storeId: string, @Query() query: PaginationQueryDto) {
    return this.ingredientService.findAll(storeId, query);
  }

  @Get('store/:storeId/low-stock')
  @ApiOperation({ summary: 'Get low stock ingredients' })
  getLowStock(@Param('storeId') storeId: string) {
    return this.ingredientService.getLowStock(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient by ID' })
  findOne(@Param('id') id: string) {
    return this.ingredientService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ingredient' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ingredientService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ingredient' })
  remove(@Param('id') id: string) {
    return this.ingredientService.remove(id);
  }
}
