import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto, OpenSessionDto } from './dto/table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @ApiOperation({ summary: 'Create a table' })
  create(@Body() dto: CreateTableDto) {
    return this.tableService.create(dto);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List tables for a store' })
  findAll(@Param('storeId') storeId: string) {
    return this.tableService.findAll(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table by ID' })
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update table' })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tableService.update(id, dto);
  }

  @Post(':id/open-session')
  @ApiOperation({ summary: 'Open a table session' })
  openSession(
    @Param('id') id: string,
    @Body() body: OpenSessionDto,
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
  ) {
    return this.tableService.openSession(
      id,
      body.customerName,
      body.customerPhone,
      body.assignedStaffUserId,
      currentUser,
    );
  }

  @Public()
  @Post(':id/public-session')
  @ApiOperation({ summary: 'Get or create active session for a scanned table' })
  getOrCreatePublicSession(@Param('id') id: string) {
    return this.tableService.getOrCreatePublicSession(id);
  }

  @Post('sessions/:sessionId/close')
  @ApiOperation({ summary: 'Close a table session' })
  closeSession(@Param('sessionId') sessionId: string) {
    return this.tableService.closeSession(sessionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete table (set OUT_OF_SERVICE)' })
  remove(@Param('id') id: string) {
    return this.tableService.remove(id);
  }
}
