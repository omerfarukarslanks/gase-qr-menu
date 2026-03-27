import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EventsGateway } from '../../gateway/events.gateway';
import { CartService } from '../cart/cart.service';

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: [],
  CANCELLED: [],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly cartService: CartService,
  ) {}

  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;

    // Generate daily order number
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

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        storeId: orderData.storeId,
        tableSessionId: orderData.tableSessionId,
        notes: orderData.notes,
        orderNumber,
        status: 'PENDING',
        totalAmount,
        taxAmount: 0,
        discountAmount: 0,
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
      include: {
        items: { include: { product: true } },
        tableSession: { include: { tableRef: true } },
      },
    });

    // Emit WebSocket events for new order
    this.eventsGateway.emitNewOrder(dto.storeId, order);

    return order;
  }

  async createFromCart(dto: CreateOrderFromCartDto) {
    // Get cart from Redis
    const cart = await this.cartService.getCart(dto.sessionId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Generate daily order number
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

    const order = await prisma.order.create({
      data: {
        storeId: dto.storeId,
        tableSessionId: dto.tableSessionId,
        notes: dto.notes,
        orderNumber,
        status: 'PENDING',
        totalAmount,
        taxAmount: 0,
        discountAmount: 0,
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
      include: {
        items: { include: { product: true } },
        tableSession: { include: { tableRef: true } },
      },
    });

    // Clear the cart after order creation
    await this.cartService.clearCart(dto.sessionId);

    // Emit WebSocket events for new order
    this.eventsGateway.emitNewOrder(dto.storeId, order);

    return order;
  }

  async findAll(storeId: string, query: PaginationQueryDto & { status?: string }) {
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
        include: {
          items: { include: { product: true } },
          tableSession: { include: { tableRef: true } },
        },
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
      include: {
        items: { include: { product: true } },
        tableSession: { include: { tableRef: true } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const allowedStatuses = STATUS_FLOW[order.status] || [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}. Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { tableRef: true } },
      },
    });

    // Emit WebSocket events for status update
    this.eventsGateway.emitOrderStatusUpdate(order.storeId, updatedOrder);

    // TODO: When status becomes CONFIRMED, auto-deduct stock via StockService
    // if (dto.status === 'CONFIRMED') {
    //   await this.stockService.deductStockForOrder(updatedOrder);
    // }

    return updatedOrder;
  }

  async getActiveOrders(storeId: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { tableRef: true } },
      },
    });
  }
}
