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
import { ProductService } from './product.service';
import {
  CreateProductDto,
  ProductListQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('products')
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Public()
  @Get('store/:storeId')
  @ApiOperation({ summary: 'List products for a store (public)' })
  findAll(
    @Param('storeId') storeId: string,
    @Query() query: ProductListQueryDto,
  ) {
    return this.productService.findAll(storeId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete product' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
