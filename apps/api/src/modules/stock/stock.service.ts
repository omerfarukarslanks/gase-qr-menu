import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateStockMovementDto } from './dto/stock.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class StockService {
  private logger = new Logger('StockService');

  constructor(private readonly eventsGateway: EventsGateway) {}

  async createMovement(dto: CreateStockMovementDto) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    let quantityChange = dto.quantity;
    if (dto.type === 'OUT' || dto.type === 'WASTE') {
      quantityChange = -Math.abs(dto.quantity);
    } else if (dto.type === 'ADJUSTMENT') {
      quantityChange = dto.quantity - ingredient.currentStock;
    }

    const movement = await prisma.stockMovement.create({
      data: {
        ingredientId: dto.ingredientId,
        storeId: dto.storeId,
        type: dto.type as any,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        notes: dto.notes,
        referenceId: dto.referenceId,
      },
      include: { ingredient: true },
    });

    const updatedIngredient = await prisma.ingredient.update({
      where: { id: dto.ingredientId },
      data: {
        currentStock: dto.type === 'ADJUSTMENT'
          ? dto.quantity
          : { increment: quantityChange },
      },
    });

    // Check low stock and emit alert
    if (updatedIngredient.currentStock <= updatedIngredient.lowStockThreshold) {
      this.eventsGateway.sendToStore(dto.storeId, 'stockLow', {
        ingredientId: updatedIngredient.id,
        name: updatedIngredient.name,
        currentStock: updatedIngredient.currentStock,
        threshold: updatedIngredient.lowStockThreshold,
      });
    }

    return movement;
  }

  // Auto-deduct stock when order is confirmed
  async deductStockForOrder(order: any) {
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    if (!orderWithItems) return;

    for (const item of orderWithItems.items) {
      for (const pi of item.product.ingredients) {
        if (!pi.quantity) continue;

        const deductQty = pi.quantity * item.quantity;

        try {
          await prisma.stockMovement.create({
            data: {
              ingredientId: pi.ingredientId,
              storeId: orderWithItems.storeId,
              type: 'OUT',
              quantity: deductQty,
              notes: `Siparis #${orderWithItems.orderNumber} - ${item.product.slug}`,
              referenceId: orderWithItems.id,
            },
          });

          const updatedIngredient = await prisma.ingredient.update({
            where: { id: pi.ingredientId },
            data: { currentStock: { decrement: deductQty } },
          });

          // Low stock alert
          if (updatedIngredient.currentStock <= updatedIngredient.lowStockThreshold) {
            this.eventsGateway.sendToStore(orderWithItems.storeId, 'stockLow', {
              ingredientId: updatedIngredient.id,
              name: updatedIngredient.name,
              currentStock: updatedIngredient.currentStock,
              threshold: updatedIngredient.lowStockThreshold,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to deduct stock for ingredient ${pi.ingredientId}: ${error}`,
          );
        }
      }
    }
  }

  async getMovements(storeId: string, query: PaginationQueryDto & { ingredientId?: string; type?: string }) {
    const where: any = { storeId };

    if (query.ingredientId) {
      where.ingredientId = query.ingredientId;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { ingredient: { include: { unit: true } } },
      }),
      prisma.stockMovement.count({ where }),
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

  async getLowStockAlerts(storeId: string) {
    const ingredients = await prisma.ingredient.findMany({
      where: { storeId },
      include: { unit: true },
    });

    return ingredients
      .filter((i) => i.currentStock <= i.lowStockThreshold)
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: i.currentStock,
        lowStockThreshold: i.lowStockThreshold,
        unit: i.unit,
        deficit: i.lowStockThreshold - i.currentStock,
      }));
  }

  async getStockSummary(storeId: string) {
    const ingredients = await prisma.ingredient.findMany({
      where: { storeId },
      include: { unit: true },
      orderBy: { name: 'asc' },
    });

    const lowStockCount = ingredients.filter(
      (i) => i.currentStock <= i.lowStockThreshold,
    ).length;

    const totalValue = ingredients.reduce(
      (sum, i) => sum + i.currentStock * i.cost,
      0,
    );

    return {
      totalIngredients: ingredients.length,
      lowStockCount,
      totalValue,
      ingredients,
    };
  }
}
