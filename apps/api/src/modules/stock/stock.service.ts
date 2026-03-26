import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateStockMovementDto } from './dto/stock.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StockService {
  async createMovement(dto: CreateStockMovementDto) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    // Calculate new stock level
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
        type: dto.type,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        notes: dto.notes,
        referenceId: dto.referenceId,
      },
      include: { ingredient: true },
    });

    // Update ingredient stock
    await prisma.ingredient.update({
      where: { id: dto.ingredientId },
      data: {
        currentStock: dto.type === 'ADJUSTMENT'
          ? dto.quantity
          : { increment: quantityChange },
      },
    });

    return movement;
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
