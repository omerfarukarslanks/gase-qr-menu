import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

type ReportPeriod = {
  startDate: string;
  endDate: string;
};

type RevenueSeriesRow = {
  day: Date | string;
  orderCount: number;
  revenue: number;
};

@Injectable()
export class ReportService {
  async getOverviewReport(storeId: string, startDate: string, endDate: string) {
    const { start, end, period } = await this.resolveRange(storeId, startDate, endDate);

    const [summary, customerSummary, revenueByDay, ordersByStatus, paymentMethods] =
      await Promise.all([
        this.getOrderSummary(storeId, start, end),
        this.getCustomerSummary(storeId, start, end),
        this.getRevenueSeries(storeId, start, end),
        this.getOrdersByStatus(storeId, start, end),
        this.getPaymentMethods(storeId, start, end),
      ]);

    return {
      period,
      summary: {
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        averageOrderAmount: summary.averageOrderAmount,
        totalCustomers: customerSummary.totalCustomers,
      },
      series: {
        revenueByDay,
      },
      breakdown: {
        ordersByStatus,
        paymentMethods,
      },
    };
  }

  async getDailyReport(storeId: string, date: string) {
    return this.getOverviewReport(storeId, date, date);
  }

  async getMonthlyReport(storeId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    return this.getOverviewReport(
      storeId,
      this.formatDateKey(start),
      this.formatDateKey(end),
    );
  }

  async getProductAnalytics(storeId: string, startDate: string, endDate: string) {
    const [{ start, end, period }, defaultLanguage] = await Promise.all([
      this.resolveRange(storeId, startDate, endDate),
      this.getDefaultLanguage(storeId),
    ]);

    const analytics = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      _count: { _all: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 10,
    });

    const productIds = analytics.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        slug: true,
        translations: {
          select: {
            languageId: true,
            name: true,
          },
        },
        images: {
          where: { isCover: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    const items = analytics.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const quantity = item._sum.quantity || 0;
      const revenue = item._sum.totalPrice || 0;

      return {
        productId: item.productId,
        productName: this.pickTranslatedName(product?.translations ?? [], product?.slug ?? 'Urun', defaultLanguage),
        quantity,
        revenue,
        orderCount: item._count._all,
        imageUrl: product?.images[0]?.url ?? null,
      };
    });

    return {
      period,
      summary: {
        totalProducts: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
      },
      items,
    };
  }

  async getCustomerAnalytics(storeId: string, startDate: string, endDate: string) {
    const { start, end, period } = await this.resolveRange(storeId, startDate, endDate);
    const summary = await this.getCustomerSummary(storeId, start, end);

    const recentVisits = await prisma.customerVisit.findMany({
      where: {
        storeId,
        visitDate: { gte: start, lte: end },
      },
      orderBy: { visitDate: 'desc' },
      take: 8,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      period,
      summary,
      items: recentVisits.map((visit) => ({
        customerId: visit.customerId,
        customerName: visit.customer.name,
        email: visit.customer.email,
        visitDate: visit.visitDate.toISOString(),
        totalSpent: visit.totalSpent,
      })),
    };
  }

  async getStaffAnalytics(storeId: string, startDate: string, endDate: string) {
    const { start, end, period } = await this.resolveRange(storeId, startDate, endDate);

    const grouped = await prisma.order.groupBy({
      by: ['takenByUserId'],
      where: {
        storeId,
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      _count: { _all: true },
      _sum: { finalAmount: true },
      orderBy: {
        _sum: {
          finalAmount: 'desc',
        },
      },
    });

    const userIds = grouped
      .map((item) => item.takenByUserId)
      .filter((value): value is string => Boolean(value));

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        userStores: {
          where: {
            storeId,
            isActive: true,
          },
          select: {
            role: true,
          },
        },
      },
    });

    const items = grouped.map((item) => {
      const revenue = item._sum.finalAmount || 0;
      const orderCount = item._count._all;
      const user = users.find((candidate) => candidate.id === item.takenByUserId);

      if (!user) {
        return {
          staffUserId: null,
          staffName: 'Sistem / Atanmayan',
          role: 'SYSTEM',
          orderCount,
          revenue,
          averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
        };
      }

      return {
        staffUserId: user.id,
        staffName: user.name,
        role: user.userStores[0]?.role ?? 'STAFF',
        orderCount,
        revenue,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      };
    });

    const unassignedOrders =
      items.find((item) => item.staffUserId === null)?.orderCount ?? 0;

    return {
      period,
      summary: {
        trackedOrders: items.reduce(
          (sum, item) => sum + (item.staffUserId ? item.orderCount : 0),
          0,
        ),
        unassignedOrders,
        totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
      },
      items,
    };
  }

  private async resolveRange(storeId: string, startDate: string, endDate: string) {
    await this.ensureStoreExists(storeId);

    const start = this.parseDateInput(startDate, false);
    const end = this.parseDateInput(endDate, true);

    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return {
      start,
      end,
      period: {
        startDate: this.formatDateKey(start),
        endDate: this.formatDateKey(end),
      } satisfies ReportPeriod,
    };
  }

  private async ensureStoreExists(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }
  }

  private async getDefaultLanguage(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { defaultLanguage: true },
    });

    return store?.defaultLanguage ?? 'tr';
  }

  private async getOrderSummary(storeId: string, start: Date, end: Date) {
    const aggregate = await prisma.order.aggregate({
      where: {
        storeId,
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      _sum: {
        finalAmount: true,
      },
      _count: {
        _all: true,
      },
      _avg: {
        finalAmount: true,
      },
    });

    return {
      totalOrders: aggregate._count._all,
      totalRevenue: aggregate._sum.finalAmount || 0,
      averageOrderAmount: aggregate._avg.finalAmount || 0,
    };
  }

  private async getCustomerSummary(storeId: string, start: Date, end: Date) {
    const visits = await prisma.customerVisit.findMany({
      where: {
        storeId,
        visitDate: { gte: start, lte: end },
      },
      select: {
        customerId: true,
        totalSpent: true,
      },
    });

    const customerIds = [...new Set(visits.map((visit) => visit.customerId))];

    const allCustomerVisits = customerIds.length
      ? await prisma.customerVisit.groupBy({
          by: ['customerId'],
          where: {
            storeId,
            customerId: { in: customerIds },
          },
          _min: {
            visitDate: true,
          },
        })
      : [];

    const firstVisitMap = new Map(
      allCustomerVisits.map((visit) => [visit.customerId, visit._min.visitDate]),
    );

    const newCustomers = customerIds.filter((customerId) => {
      const firstVisit = firstVisitMap.get(customerId);
      return firstVisit ? firstVisit >= start && firstVisit <= end : false;
    }).length;

    const totalCustomers = customerIds.length;
    const totalVisits = visits.length;
    const totalSpend = visits.reduce((sum, visit) => sum + visit.totalSpent, 0);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers: Math.max(totalCustomers - newCustomers, 0),
      averageVisits: totalCustomers > 0 ? totalVisits / totalCustomers : 0,
      averageSpend: totalCustomers > 0 ? totalSpend / totalCustomers : 0,
    };
  }

  private async getRevenueSeries(storeId: string, start: Date, end: Date) {
    const rows = await prisma.$queryRaw<RevenueSeriesRow[]>`
      SELECT
        DATE(created_at) AS day,
        COUNT(*)::int AS "orderCount",
        COALESCE(SUM(final_amount), 0)::float AS revenue
      FROM orders
      WHERE store_id = ${storeId}
        AND created_at >= ${start}
        AND created_at <= ${end}
        AND status != 'CANCELLED'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;

    const rowMap = new Map(
      rows.map((row) => [this.formatDateKey(new Date(row.day)), row]),
    );

    const series: Array<{ date: string; label: string; revenue: number; orders: number }> = [];

    for (
      const cursor = new Date(start.getTime());
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dateKey = this.formatDateKey(cursor);
      const row = rowMap.get(dateKey);

      series.push({
        date: dateKey,
        label: this.formatSeriesLabel(cursor),
        revenue: row?.revenue || 0,
        orders: row?.orderCount || 0,
      });
    }

    return series;
  }

  private async getOrdersByStatus(storeId: string, start: Date, end: Date) {
    const rows = await prisma.order.groupBy({
      by: ['status'],
      where: {
        storeId,
        createdAt: { gte: start, lte: end },
      },
      _count: {
        _all: true,
      },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  private async getPaymentMethods(storeId: string, start: Date, end: Date) {
    const rows = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        storeId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    return rows.map((row) => ({
      method: row.method,
      count: row._count._all,
      amount: row._sum.amount || 0,
    }));
  }

  private parseDateInput(value: string, endOfDay: boolean) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('Date format must be YYYY-MM-DD');
    }

    const [, year, month, day] = match;
    const date = endOfDay
      ? new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
      : new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return date;
  }

  private formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatSeriesLabel(date: Date) {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
    });
  }

  private pickTranslatedName(
    translations: Array<{ languageId: string; name: string }>,
    fallbackName: string,
    defaultLanguage: string,
  ) {
    return (
      translations.find((translation) => translation.languageId === defaultLanguage)?.name ||
      translations[0]?.name ||
      fallbackName
    );
  }
}
