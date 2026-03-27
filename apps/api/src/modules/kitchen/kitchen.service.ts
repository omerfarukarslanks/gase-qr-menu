import { Injectable } from '@nestjs/common';
import { prisma } from '@gase/database';

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
    return prisma.order.findMany({
      where: { storeId, status },
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
    return prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status },
      include: { product: true, order: true },
    });
  }

  async getKitchenStats(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeOrders, completedToday, avgPrepTime] = await Promise.all([
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
      prisma.order.count({
        where: {
          storeId,
          status: 'SERVED',
          createdAt: { gte: today },
        },
      }),
    ]);

    return {
      activeOrders,
      completedToday,
      avgPreparationTime: 0,
    };
  }
}
