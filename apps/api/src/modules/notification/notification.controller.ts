import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { CallWaiterDto } from './dto/call-waiter.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('notifications')
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Public()
  @Post('public/call-waiter')
  @ApiOperation({ summary: 'Call waiter from customer table (public)' })
  callWaiter(@Body() dto: CallWaiterDto) {
    return this.notificationService.callWaiter(dto);
  }

  @Get('store/:storeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List notifications for a store' })
  findAll(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto & { unreadOnly?: boolean },
  ) {
    return this.notificationService.findAll(storeId, query);
  }

  @Get('store/:storeId/unread-count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@Param('storeId') storeId: string) {
    return this.notificationService.getUnreadCount(storeId);
  }

  @Put(':id/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put('store/:storeId/read-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Param('storeId') storeId: string) {
    return this.notificationService.markAllAsRead(storeId);
  }
}
