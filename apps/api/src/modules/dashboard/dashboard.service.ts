import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@gase/database';

type CurrentUser = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function shiftDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function resolveOrderRevenue(order: {
  finalAmount?: number | null;
  totalAmount: number;
  discountAmount?: number | null;
}) {
  if (typeof order.finalAmount === 'number' && !Number.isNaN(order.finalAmount)) {
    return order.finalAmount;
  }

  return Math.max(0, order.totalAmount - (order.discountAmount || 0));
}

@Injectable()
export class DashboardService {
  async getOverview(storeId: string, currentUser: CurrentUser) {
    const store = await this.ensureDashboardAccess(currentUser, storeId);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const currentWeekStart = startOfDay(shiftDays(now, -6));
    const previousWeekStart = startOfDay(shiftDays(now, -13));
    const previousWeekEnd = endOfDay(shiftDays(now, -7));

    const [
      todayOrders,
      revenueOrders,
      activeTables,
      totalTables,
      activeProducts,
      kitchenPending,
      customerGroups,
      lowStockIngredients,
      recentOrdersRaw,
      topProductRows,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: 'DRAFT' },
        },
      }),
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: previousWeekStart, lte: todayEnd },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
        select: {
          createdAt: true,
          totalAmount: true,
          finalAmount: true,
          discountAmount: true,
        },
      }),
      prisma.restaurantTable.count({
        where: {
          storeId,
          status: { not: 'OUT_OF_SERVICE' },
          currentSessionId: { not: null },
        },
      }),
      prisma.restaurantTable.count({
        where: {
          storeId,
          status: { not: 'OUT_OF_SERVICE' },
        },
      }),
      prisma.product.count({
        where: {
          storeId,
          isActive: true,
        },
      }),
      prisma.order.count({
        where: {
          storeId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        },
      }),
      prisma.customerVisit.groupBy({
        by: ['customerId'],
        where: { storeId },
      }),
      prisma.ingredient.findMany({
        where: { storeId },
        select: {
          id: true,
          currentStock: true,
          lowStockThreshold: true,
        },
      }),
      prisma.order.findMany({
        where: {
          storeId,
          status: { not: 'DRAFT' },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          tableSession: {
            include: {
              tableRef: {
                select: {
                  id: true,
                  name: true,
                },
              },
              assignedStaff: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          takenBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  translations: {
                    select: {
                      name: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            createdAt: { gte: currentWeekStart, lte: todayEnd },
            status: { notIn: ['DRAFT', 'CANCELLED'] },
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const [productRecords, defaultLanguage] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: {
            in: topProductRows.map((row) => row.productId),
          },
        },
        select: {
          id: true,
          slug: true,
          translations: {
            select: {
              name: true,
              language: {
                select: {
                  code: true,
                },
              },
            },
          },
          images: {
            where: { isCover: true },
            take: 1,
            select: {
              url: true,
            },
          },
        },
      }),
      prisma.store.findUnique({
        where: { id: store.id },
        select: { defaultLanguage: true },
      }),
    ]);

    const todayRevenue = revenueOrders
      .filter((order) => order.createdAt >= todayStart && order.createdAt <= todayEnd)
      .reduce((sum, order) => sum + resolveOrderRevenue(order), 0);

    const currentWeekRevenue = revenueOrders
      .filter((order) => order.createdAt >= currentWeekStart && order.createdAt <= todayEnd)
      .reduce((sum, order) => sum + resolveOrderRevenue(order), 0);

    const previousWeekRevenue = revenueOrders
      .filter((order) => order.createdAt >= previousWeekStart && order.createdAt <= previousWeekEnd)
      .reduce((sum, order) => sum + resolveOrderRevenue(order), 0);

    const weeklyGrowthPercent =
      previousWeekRevenue === 0
        ? currentWeekRevenue > 0
          ? 100
          : 0
        : ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100;

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      tableName: order.tableSession?.tableRef?.name ?? 'Masa',
      customerName: order.tableSession?.customerName ?? null,
      takenByName:
        order.takenBy?.name ?? order.tableSession?.assignedStaff?.name ?? 'Sistem',
      totalAmount: resolveOrderRevenue(order),
      itemSummary: order.items
        .slice(0, 3)
        .map(
          (item) =>
            `${item.quantity}x ${item.product.translations[0]?.name ?? item.product.slug ?? 'Urun'}`,
        )
        .join(', '),
      itemCount: order.items.length,
    }));

    const selectedDefaultLanguage = defaultLanguage?.defaultLanguage ?? 'tr';
    const topProducts = topProductRows.map((row) => {
      const product = productRecords.find((candidate) => candidate.id === row.productId);
      const translation =
        product?.translations.find(
          (candidate) =>
            candidate.language.code.toLowerCase() === selectedDefaultLanguage.toLowerCase(),
        ) ?? product?.translations[0];

      return {
        productId: row.productId,
        productName: translation?.name ?? product?.slug ?? 'Urun',
        quantity: row._sum.quantity || 0,
        revenue: row._sum.totalPrice || 0,
        orderCount: row._count._all,
        imageUrl: product?.images[0]?.url ?? null,
      };
    });

    return {
      summary: {
        todayOrders,
        todayRevenue,
        activeTables,
        totalTables,
        activeProducts,
        kitchenPending,
        totalCustomers: customerGroups.length,
        weeklyGrowthPercent: Math.round(weeklyGrowthPercent * 100) / 100,
        lowStockCount: lowStockIngredients.filter(
          (ingredient) => ingredient.currentStock <= ingredient.lowStockThreshold,
        ).length,
      },
      recentOrders,
      topProducts,
      live: {
        updatedAt: new Date().toISOString(),
      },
    };
  }

  private async ensureDashboardAccess(currentUser: CurrentUser, storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return store;
    }

    if (
      currentUser.role === 'OWNER' &&
      currentUser.organizationId &&
      currentUser.organizationId === store.organizationId
    ) {
      return store;
    }

    const hasActiveMembership =
      currentUser.userStores?.some(
        (membership) => membership.storeId === storeId && membership.isActive,
      ) ?? false;

    if (!hasActiveMembership) {
      throw new ForbiddenException('You do not have access to this store dashboard');
    }

    return store;
  }
}
