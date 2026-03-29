import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StockService } from './stock.service';
import {
  CreatePurchaseReceiptDto,
  CreateStockCountDto,
  CreateStockMovementDto,
  CreateSupplierDto,
  StockMovementQueryDto,
  UpdateSupplierDto,
} from './dto/stock.dto';

type CurrentUserPayload = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create a stock movement' })
  createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.createMovement(dto, currentUser);
  }

  @Post('counts')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create a stock count adjustment' })
  createCount(
    @Body() dto: CreateStockCountDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.createCount(dto, currentUser);
  }

  @Get('movements/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get stock movements for a store' })
  getMovements(
    @Param('storeId') storeId: string,
    @Query() query: StockMovementQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getMovements(storeId, query, currentUser);
  }

  @Get('alerts/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStockAlerts(
    @Param('storeId') storeId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getLowStockAlerts(storeId, currentUser);
  }

  @Get('summary/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get stock summary' })
  getStockSummary(
    @Param('storeId') storeId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getStockSummary(storeId, currentUser);
  }

  @Get('ingredients/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get ingredient inventory view for a store' })
  getIngredientInventory(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getIngredientInventory(storeId, query, currentUser);
  }

  @Get('ingredients/:ingredientId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get inventory detail for an ingredient' })
  getIngredientInventoryDetail(
    @Param('ingredientId') ingredientId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getIngredientInventoryDetail(ingredientId, currentUser);
  }

  @Get('suppliers/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get suppliers for a store' })
  getSuppliers(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getSuppliers(storeId, query, currentUser);
  }

  @Post('suppliers')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a supplier' })
  createSupplier(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.createSupplier(dto, currentUser);
  }

  @Put('suppliers/:id')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a supplier' })
  updateSupplier(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.updateSupplier(id, dto, currentUser);
  }

  @Get('purchases/store/:storeId')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Get purchase receipts for a store' })
  getPurchaseReceipts(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.getPurchaseReceipts(storeId, query, currentUser);
  }

  @Post('purchases')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a purchase receipt and stock entries' })
  createPurchaseReceipt(
    @Body() dto: CreatePurchaseReceiptDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.stockService.createPurchaseReceipt(dto, currentUser);
  }
}
