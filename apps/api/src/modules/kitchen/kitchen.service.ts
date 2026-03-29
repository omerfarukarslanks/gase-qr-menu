import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderItemStatus, OrderStatus, prisma } from '@gase/database';

const ORDER_STATUSES = Object.values(OrderStatus);
const ORDER_ITEM_STATUSES = Object.values(OrderItemStatus);

@Injectable()
export class KitchenService {
  async getActiveOrders(storeId: string) {
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                preparationTime: true,
                translations: { select: { name: true, languageId: true } },
                images: { where: { isCover: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
        tableSession: {
          include: { tableRef: { select: { id: true, name: true, section: true } } },
        },
      },
    });

    return {
      pending: orders.filter((o) => o.status === 'PENDING'),
      confirmed: orders.filter((o) => o.status === 'CONFIRMED'),
      preparing: orders.filter((o) => o.status === 'PREPARING'),
      ready: orders.filter((o) => o.status === 'READY'),
      total: orders.length,
    };
  }

  async getOrdersByStatus(storeId: string, status: string) {
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }

    return prisma.order.findMany({
      where: { storeId, status: status as OrderStatus },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                preparationTime: true,
                translations: { select: { name: true, languageId: true } },
                images: { where: { isCover: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
        tableSession: {
          include: { tableRef: { select: { id: true, name: true, section: true } } },
        },
      },
    });
  }

  async updateOrderItemStatus(orderItemId: string, status: string) {
    if (!ORDER_ITEM_STATUSES.includes(status as OrderItemStatus)) {
      throw new BadRequestException(`Invalid order item status: ${status}`);
    }

    return prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: status as OrderItemStatus },
      include: { product: true, order: true },
    });
  }

  async getKitchenStats(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeOrders, completedToday, servedOrders] = await Promise.all([
      prisma.order.count({
        where: {
          storeId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        },
      }),
      prisma.order.count({
        where: {
          storeId,
          status: 'SERVED',
          createdAt: { gte: today },
        },
      }),
      prisma.order.findMany({
        where: {
          storeId,
          status: 'SERVED',
          createdAt: { gte: today },
        },
        select: { createdAt: true, updatedAt: true },
      }),
    ]);

    const avgPreparationTime =
      servedOrders.length > 0
        ? Math.round(
            servedOrders.reduce(
              (sum, o) => sum + (o.updatedAt.getTime() - o.createdAt.getTime()),
              0,
            ) /
              servedOrders.length /
              60000,
          )
        : 0;

    return {
      activeOrders,
      completedToday,
      avgPreparationTime,
    };
  }
}
