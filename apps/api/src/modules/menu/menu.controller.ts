import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto, ToggleMenuCategoryDto, ToggleMenuProductDto } from './dto/menu.dto';
import { PublicMenuFiltersDto } from './dto/public-menu-filters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('menus')
@Controller('api/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a menu' })
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @Get('store/:storeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List menus for a store' })
  findAll(@Param('storeId') storeId: string) {
    return this.menuService.findAll(storeId);
  }

  @Public()
  @Get('public/by-token/:qrToken')
  @ApiOperation({ summary: 'Get public menu by QR token with filters' })
  getMenuByToken(
    @Param('qrToken') qrToken: string,
    @Query() filters: PublicMenuFiltersDto,
  ) {
    return this.menuService.getMenuByToken(qrToken, filters);
  }

  @Public()
  @Get('public/product/:productId')
  @ApiOperation({ summary: 'Get public product detail' })
  getPublicProduct(
    @Param('productId') productId: string,
    @Query('lang') lang?: string,
  ) {
    return this.menuService.getPublicProduct(productId, lang);
  }

  @Public()
  @Get('public/:storeId')
  @ApiOperation({ summary: 'Get public menu for QR scanning' })
  getPublicMenu(@Param('storeId') storeId: string) {
    return this.menuService.getPublicMenu(storeId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get menu by ID' })
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Get(':id/qr')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate QR code for menu' })
  generateQr(@Param('id') id: string, @Query('tableId') tableId?: string) {
    return this.menuService.generateQrCode(id, tableId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update menu' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  @Patch(':menuId/categories/:categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle menu category activation' })
  toggleMenuCategory(
    @Param('menuId') menuId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: ToggleMenuCategoryDto,
  ) {
    return this.menuService.toggleMenuCategory(menuId, categoryId, dto);
  }

  @Patch(':menuId/products/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle menu product activation' })
  toggleMenuProduct(
    @Param('menuId') menuId: string,
    @Param('productId') productId: string,
    @Body() dto: ToggleMenuProductDto,
  ) {
    return this.menuService.toggleMenuProduct(menuId, productId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete menu' })
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
