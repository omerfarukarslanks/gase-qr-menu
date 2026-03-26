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
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new store' })
  create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List stores for organization' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.storeService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update store' })
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storeService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Soft delete store' })
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}
