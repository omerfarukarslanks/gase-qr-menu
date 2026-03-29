import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { EventsGateway } from '../../gateway/events.gateway';
import { CreateNotificationDto } from './dto/notification.dto';
import { CallWaiterDto } from './dto/call-waiter.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MobileDeviceService } from '../mobile-device/mobile-device.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly mobileDeviceService: MobileDeviceService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        storeId: dto.storeId,
        type: dto.type as any,
        message: dto.message || dto.title,
        data: dto.metadata || {},
      },
    });

    // Emit via WebSocket if gateway is set
    if (this.eventsGateway) {
      this.eventsGateway.sendToStore(dto.storeId, 'notification', notification);
    }

    return notification;
  }

  async callWaiter(dto: CallWaiterDto) {
    const notification = await prisma.notification.create({
      data: {
        storeId: dto.storeId,
        type: 'WAITER_CALL',
        tableId: dto.tableId,
        message: dto.message || `Waiter called${dto.tableName ? ` from ${dto.tableName}` : ''}`,
        data: {
          tableId: dto.tableId,
          tableName: dto.tableName || null,
        },
      },
    });

    // Emit via WebSocket if gateway is set
    if (this.eventsGateway) {
      this.eventsGateway.sendToStore(dto.storeId, 'waiterCall', {
        notificationId: notification.id,
        tableId: dto.tableId,
        tableName: dto.tableName,
        message: dto.message,
        timestamp: new Date().toISOString(),
      });
    }

    void this.mobileDeviceService
      .notifyWaiterCall(dto.storeId, dto.tableName)
      .catch(() => undefined);

    return notification;
  }

  async findAll(storeId: string, query: PaginationQueryDto & { unreadOnly?: boolean }) {
    const where: any = { storeId };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        ...query.prismaPagination,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: query.buildMeta(total),
    };
  }

  async markAsRead(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(storeId: string) {
    await prisma.notification.updateMany({
      where: { storeId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(storeId: string) {
    const count = await prisma.notification.count({
      where: { storeId, isRead: false },
    });
    return { count };
  }
}
