import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, prisma } from '@gase/database';
import { CreateOrderDto, OrderListQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { EventsGateway } from '../../gateway/events.gateway';
import { CartService } from '../cart/cart.service';
import { CampaignService } from '../campaign/campaign.service';
import { StockService } from '../stock/stock.service';
import { CustomerService } from '../customer/customer.service';
import { getStoreOperatingStatus } from '../../common/utils/store-availability.util';

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: [],
  CANCELLED: [],
};

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  tableSession: {
    include: {
      tableRef: true,
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
      email: true,
    },
  },
  campaign: true,
  payments: true,
} as const;

@Injectable()
export class OrderService {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly cartService: CartService,
    private readonly campaignService: CampaignService,
    private readonly stockService: StockService,
    private readonly customerService: CustomerService,
  ) {}

  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;
    await this.assertStoreAcceptingOrders(dto.storeId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await prisma.order.findFirst({
      where: {
        storeId: dto.storeId,
        createdAt: { gte: today },
      },
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = (lastOrder?.orderNumber || 0) + 1;
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Calculate tax from product taxRate
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, taxRate: true },
    });
    const taxRateMap = new Map(products.map((p) => [p.id, p.taxRate]));
    const taxAmount = items.reduce((sum, item) => {
      const rate = taxRateMap.get(item.productId) ?? 0;
      return sum + item.unitPrice * item.quantity * rate / 100;
    }, 0);

    // Calculate campaign discount
    let discountAmount = 0;
    let campaignId: string | undefined;
    let couponCode: string | undefined;

    try {
      const discount = await this.campaignService.calculateDiscount(
        dto.storeId,
        totalAmount,
        items,
        dto.couponCode,
      );
      if (discount) {
        discountAmount = discount.discountAmount;
        campaignId = discount.campaignId;
        couponCode = dto.couponCode;
      }
    } catch {}

    const finalAmount = Math.max(0, totalAmount + taxAmount - discountAmount);
    const takenByUserId = await this.resolveTakenByUserId(
      dto.storeId,
      dto.tableSessionId,
      dto.takenByUserId,
    );

    const order = await prisma.order.create({
      data: {
        storeId: orderData.storeId,
        tableSessionId: orderData.tableSessionId,
        notes: orderData.notes,
        takenByUserId,
        orderNumber,
        status: 'PENDING',
        totalAmount,
        taxAmount,
        discountAmount,
        finalAmount,
        campaignId,
        couponCode,
        items: {
          createMany: {
            data: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              notes: item.notes,
            })),
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    // Increment campaign usage
    if (campaignId) {
      await this.campaignService.incrementUsage(campaignId);
    }

    this.eventsGateway.emitNewOrder(dto.storeId, order);
    return order;
  }

  async createFromCart(dto: CreateOrderFromCartDto) {
    await this.assertStoreAcceptingOrders(dto.storeId);
    const cart = await this.cartService.getCart(dto.sessionId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await prisma.order.findFirst({
      where: {
        storeId: dto.storeId,
        createdAt: { gte: today },
      },
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = (lastOrder?.orderNumber || 0) + 1;
    const totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Calculate tax from product taxRate
    const cartProductIds = [...new Set(cart.items.map((item: any) => item.productId))];
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: cartProductIds } },
      select: { id: true, taxRate: true },
    });
    const cartTaxRateMap = new Map(cartProducts.map((p) => [p.id, p.taxRate]));
    const taxAmount = cart.items.reduce((sum: number, item: any) => {
      const rate = cartTaxRateMap.get(item.productId) ?? 0;
      return sum + item.unitPrice * item.quantity * rate / 100;
    }, 0);

    // Calculate campaign discount
    let discountAmount = 0;
    let campaignId: string | undefined;

    try {
      const discount = await this.campaignService.calculateDiscount(
        dto.storeId,
        totalAmount,
        cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        dto.couponCode,
      );
      if (discount) {
        discountAmount = discount.discountAmount;
        campaignId = discount.campaignId;
      }
    } catch {}

    const finalAmount = Math.max(0, totalAmount + taxAmount - discountAmount);
    const takenByUserId = await this.resolveTakenByUserId(
      dto.storeId,
      dto.tableSessionId,
      dto.takenByUserId,
    );

    const order = await prisma.order.create({
      data: {
        storeId: dto.storeId,
        tableSessionId: dto.tableSessionId,
        notes: dto.notes,
        takenByUserId,
        orderNumber,
        status: 'PENDING',
        totalAmount,
        taxAmount,
        discountAmount,
        finalAmount,
        campaignId,
        couponCode: dto.couponCode,
        items: {
          createMany: {
            data: cart.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              notes: item.notes,
            })),
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.cartService.clearCart(dto.sessionId);

    if (campaignId) {
      await this.campaignService.incrementUsage(campaignId);
    }

    this.eventsGateway.emitNewOrder(dto.storeId, order);
    return order;
  }

  async findAll(storeId: string, query: OrderListQueryDto) {
    const where: any = { storeId };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async findOne(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    const nextStatus = dto.status as OrderStatus;

    const allowedStatuses = STATUS_FLOW[order.status] || [];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${nextStatus}. Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      include: ORDER_INCLUDE,
    });

    this.eventsGateway.emitOrderStatusUpdate(order.storeId, updatedOrder);

    // Auto-deduct stock when order is CONFIRMED
    if (nextStatus === 'CONFIRMED') {
      await this.stockService.deductStockForOrder(updatedOrder);
    }

    // Restore stock when order is CANCELLED (if stock was already deducted)
    if (
      nextStatus === 'CANCELLED' &&
      ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
    ) {
      await this.stockService.restoreStockForOrder(updatedOrder);
    }

    // Track customer visit when order is SERVED
    if (nextStatus === 'SERVED' && updatedOrder.tableSession?.customerId) {
      try {
        await this.customerService.trackVisit({
          storeId: order.storeId,
          customerId: updatedOrder.tableSession.customerId,
          totalSpent: updatedOrder.finalAmount,
        });
      } catch {}
    }

    return updatedOrder;
  }

  async getActiveOrders(storeId: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: ORDER_INCLUDE,
    });
  }

  private async resolveTakenByUserId(
    storeId: string,
    tableSessionId: string,
    explicitTakenByUserId?: string,
  ) {
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

    const tableSession = await prisma.tableSession.findUnique({
      where: { id: tableSessionId },
      select: {
        assignedStaffUserId: true,
        tableRef: {
          select: {
            storeId: true,
          },
        },
      },
    });

    if (!tableSession) {
      throw new NotFoundException('Table session not found');
    }

    if (tableSession.tableRef.storeId !== storeId) {
      throw new BadRequestException('Table session does not belong to the selected store');
    }

    const candidateUserId = explicitTakenByUserId || tableSession.assignedStaffUserId;

    if (!candidateUserId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
        userStores: {
          where: {
            storeId,
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Staff user not found');
    }

    const isOrganizationOwner =
      user.role === 'OWNER' && user.organizationId === store.organizationId;

    if (!isOrganizationOwner && user.userStores.length === 0 && user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Selected staff user does not have access to this store');
    }

    return user.id;
  }

  private async assertStoreAcceptingOrders(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        isActive: true,
        timezone: true,
        settings: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const operatingStatus = getStoreOperatingStatus({
      isActive: store.isActive,
      settings: store.settings,
      timezone: store.timezone,
    });

    if (!operatingStatus.acceptingOrders) {
      throw new BadRequestException(operatingStatus.message);
    }
  }
}
