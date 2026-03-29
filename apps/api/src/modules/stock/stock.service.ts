import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType, StoreRole, UserRole, prisma } from '@gase/database';
import { EventsGateway } from '../../gateway/events.gateway';
import {
  CreatePurchaseReceiptDto,
  CreateStockCountDto,
  CreateStockMovementDto,
  CreateSupplierDto,
  StockMovementQueryDto,
  UpdateSupplierDto,
} from './dto/stock.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

type CurrentUser = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

type TransactionClient = Prisma.TransactionClient;

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

@Injectable()
export class StockService {
  private logger = new Logger('StockService');

  constructor(private readonly eventsGateway: EventsGateway) {}

  async createMovement(dto: CreateStockMovementDto, currentUser: CurrentUser) {
    await this.ensureStoreAccess(currentUser, dto.storeId);

    const result = await prisma.$transaction((tx) =>
      this.createMovementRecord(tx, {
        ingredientId: dto.ingredientId,
        storeId: dto.storeId,
        type: dto.type,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        reason: dto.reason,
        notes: dto.notes,
        referenceId: dto.referenceId,
        createdById: currentUser.id,
      }),
    );

    this.emitStockEvents(dto.storeId, result.updatedIngredient, result.movement);

    return result.movement;
  }

  async createCount(dto: CreateStockCountDto, currentUser: CurrentUser) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
      select: {
        id: true,
        storeId: true,
        name: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    await this.ensureStoreAccess(currentUser, ingredient.storeId);

    const result = await prisma.$transaction((tx) =>
      this.createMovementRecord(tx, {
        ingredientId: dto.ingredientId,
        storeId: ingredient.storeId,
        type: StockMovementType.ADJUSTMENT,
        quantity: dto.countedQuantity,
        reason: 'Stok sayimi',
        notes: dto.notes,
        createdById: currentUser.id,
      }),
    );

    this.emitStockEvents(ingredient.storeId, result.updatedIngredient, result.movement);
    this.eventsGateway.sendToStore(ingredient.storeId, 'stockCountCompleted', {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      countedQuantity: dto.countedQuantity,
      resultingStock: result.movement.resultingStock,
      createdAt: result.movement.createdAt,
    });

    return result.movement;
  }

  async deductStockForOrder(order: { id: string; storeId: string; orderNumber: number }) {
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
      for (const productIngredient of item.product.ingredients) {
        if (!productIngredient.quantity) continue;

        const deductQty = productIngredient.quantity * item.quantity;

        try {
          const updatedIngredient = await prisma.ingredient.update({
            where: { id: productIngredient.ingredientId },
            data: { currentStock: { decrement: deductQty } },
            include: { unit: true },
          });

          const movement = await prisma.stockMovement.create({
            data: {
              ingredientId: productIngredient.ingredientId,
              storeId: orderWithItems.storeId,
              type: StockMovementType.OUT,
              quantity: deductQty,
              notes: `Siparis #${orderWithItems.orderNumber} - ${item.product.slug}`,
              reason: 'Siparis tuketimi',
              referenceId: orderWithItems.id,
              unitId: updatedIngredient.stockUnitId,
              resultingStock: updatedIngredient.currentStock,
            },
            include: {
              ingredient: {
                include: {
                  unit: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          this.emitStockEvents(orderWithItems.storeId, updatedIngredient, movement);
        } catch (error) {
          this.logger.error(
            `Failed to deduct stock for ingredient ${productIngredient.ingredientId}: ${error}`,
          );
        }
      }
    }
  }

  async getMovements(
    storeId: string,
    query: StockMovementQueryDto,
    currentUser: CurrentUser,
  ) {
    await this.ensureStoreAccess(currentUser, storeId);

    const where: Prisma.StockMovementWhereInput = {
      storeId,
    };

    if (query.ingredientId) {
      where.ingredientId = query.ingredientId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { ingredient: { name: { contains: query.search, mode: 'insensitive' } } },
        { reason: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
        { referenceId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const dateRange = this.resolveDateRange(query.dateFrom, query.dateTo);
    if (dateRange) {
      where.createdAt = dateRange;
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredient: {
            include: {
              unit: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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

  async getLowStockAlerts(storeId: string, currentUser: CurrentUser) {
    await this.ensureStoreAccess(currentUser, storeId);

    const ingredients = await prisma.ingredient.findMany({
      where: { storeId },
      include: { unit: true },
      orderBy: [{ currentStock: 'asc' }, { name: 'asc' }],
    });

    return ingredients
      .filter((item) => item.currentStock <= item.lowStockThreshold)
      .map((item) => ({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        unit: item.unit,
        deficit: item.lowStockThreshold - item.currentStock,
      }));
  }

  async getStockSummary(storeId: string, currentUser: CurrentUser) {
    await this.ensureStoreAccess(currentUser, storeId);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [ingredients, movementGroups, todayMovementCount] = await Promise.all([
      prisma.ingredient.findMany({
        where: { storeId },
        include: { unit: true },
        orderBy: { name: 'asc' },
      }),
      prisma.stockMovement.groupBy({
        by: ['ingredientId'],
        where: { storeId },
        _max: { createdAt: true },
      }),
      prisma.stockMovement.count({
        where: {
          storeId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const lastMovementMap = new Map(
      movementGroups.map((group) => [group.ingredientId, group._max.createdAt ?? null]),
    );

    const lowStockCount = ingredients.filter(
      (ingredient) => ingredient.currentStock <= ingredient.lowStockThreshold,
    ).length;
    const negativeStockCount = ingredients.filter((ingredient) => ingredient.currentStock < 0).length;
    const totalValue = ingredients.reduce(
      (sum, ingredient) => sum + ingredient.currentStock * ingredient.cost,
      0,
    );

    const prioritizedIngredients = [...ingredients]
      .sort((left, right) => {
        const leftDeficit = left.lowStockThreshold - left.currentStock;
        const rightDeficit = right.lowStockThreshold - right.currentStock;

        if (left.currentStock < 0 && right.currentStock >= 0) return -1;
        if (right.currentStock < 0 && left.currentStock >= 0) return 1;
        if (rightDeficit !== leftDeficit) return rightDeficit - leftDeficit;

        return left.name.localeCompare(right.name, 'tr');
      })
      .slice(0, 6)
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        currentStock: ingredient.currentStock,
        lowStockThreshold: ingredient.lowStockThreshold,
        cost: ingredient.cost,
        unit: ingredient.unit,
        isLowStock: ingredient.currentStock <= ingredient.lowStockThreshold,
        isNegativeStock: ingredient.currentStock < 0,
        lastMovementAt: lastMovementMap.get(ingredient.id) ?? null,
        lastCountedAt: ingredient.lastCountedAt,
      }));

    return {
      totalIngredients: ingredients.length,
      lowStockCount,
      totalValue,
      todayMovementCount,
      negativeStockCount,
      ingredients: prioritizedIngredients,
    };
  }

  async getIngredientInventory(
    storeId: string,
    query: PaginationQueryDto,
    currentUser: CurrentUser,
  ) {
    await this.ensureStoreAccess(currentUser, storeId);

    const where: Prisma.IngredientWhereInput = { storeId };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        include: { unit: true },
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.limit,
      }),
      prisma.ingredient.count({ where }),
    ]);

    const ingredientIds = ingredients.map((ingredient) => ingredient.id);
    const last30DaysStart = startOfDay(shiftDays(new Date(), -29));

    const [latestMovementGroups, movementSummaries] = ingredientIds.length
      ? await Promise.all([
          prisma.stockMovement.groupBy({
            by: ['ingredientId'],
            where: {
              storeId,
              ingredientId: { in: ingredientIds },
            },
            _max: { createdAt: true },
          }),
          prisma.stockMovement.groupBy({
            by: ['ingredientId', 'type'],
            where: {
              storeId,
              ingredientId: { in: ingredientIds },
              createdAt: { gte: last30DaysStart },
              type: { in: [StockMovementType.OUT, StockMovementType.WASTE] },
            },
            _sum: { quantity: true },
          }),
        ])
      : [[], []];

    const lastMovementMap = new Map(
      latestMovementGroups.map((group) => [group.ingredientId, group._max.createdAt ?? null]),
    );
    const movementSummaryMap = new Map<string, { out: number; waste: number }>();

    movementSummaries.forEach((group) => {
      const entry = movementSummaryMap.get(group.ingredientId) ?? { out: 0, waste: 0 };
      if (group.type === StockMovementType.OUT) {
        entry.out = group._sum.quantity || 0;
      }
      if (group.type === StockMovementType.WASTE) {
        entry.waste = group._sum.quantity || 0;
      }
      movementSummaryMap.set(group.ingredientId, entry);
    });

    return {
      items: ingredients.map((ingredient) => {
        const summary = movementSummaryMap.get(ingredient.id) ?? { out: 0, waste: 0 };

        return {
          id: ingredient.id,
          name: ingredient.name,
          type: ingredient.type,
          currentStock: ingredient.currentStock,
          lowStockThreshold: ingredient.lowStockThreshold,
          cost: ingredient.cost,
          unit: ingredient.unit,
          isLowStock: ingredient.currentStock <= ingredient.lowStockThreshold,
          isNegativeStock: ingredient.currentStock < 0,
          lastMovementAt: lastMovementMap.get(ingredient.id) ?? null,
          lastCountedAt: ingredient.lastCountedAt,
          consumptionLast30Days: summary.out,
          wasteLast30Days: summary.waste,
        };
      }),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async getIngredientInventoryDetail(ingredientId: string, currentUser: CurrentUser) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { unit: true },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    await this.ensureStoreAccess(currentUser, ingredient.storeId);

    const last30DaysStart = startOfDay(shiftDays(new Date(), -29));

    const [recentMovements, consumptionGroups] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { ingredientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.stockMovement.groupBy({
        by: ['type'],
        where: {
          ingredientId,
          createdAt: { gte: last30DaysStart },
          type: { in: [StockMovementType.OUT, StockMovementType.WASTE] },
        },
        _sum: { quantity: true },
      }),
    ]);

    const outQuantity =
      consumptionGroups.find((group) => group.type === StockMovementType.OUT)?._sum.quantity || 0;
    const wasteQuantity =
      consumptionGroups.find((group) => group.type === StockMovementType.WASTE)?._sum.quantity || 0;
    const orderOutQuantity = await prisma.stockMovement.aggregate({
      where: {
        ingredientId,
        createdAt: { gte: last30DaysStart },
        type: StockMovementType.OUT,
        referenceId: { not: null },
      },
      _sum: { quantity: true },
    });

    return {
      id: ingredient.id,
      storeId: ingredient.storeId,
      name: ingredient.name,
      type: ingredient.type,
      currentStock: ingredient.currentStock,
      lowStockThreshold: ingredient.lowStockThreshold,
      cost: ingredient.cost,
      unit: ingredient.unit,
      lastCountedAt: ingredient.lastCountedAt,
      recentMovements,
      consumption: {
        totalOutLast30Days: outQuantity,
        wasteLast30Days: wasteQuantity,
        orderOutLast30Days: orderOutQuantity._sum.quantity || 0,
      },
    };
  }

  async getSuppliers(
    storeId: string,
    query: PaginationQueryDto,
    currentUser: CurrentUser,
  ) {
    await this.ensureStoreAccess(currentUser, storeId);

    const where: Prisma.SupplierWhereInput = {
      storeId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
      prisma.supplier.count({ where }),
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

  async createSupplier(dto: CreateSupplierDto, currentUser: CurrentUser) {
    await this.ensureProcurementAccess(currentUser, dto.storeId);

    return prisma.supplier.create({
      data: {
        storeId: dto.storeId,
        name: dto.name.trim(),
        contactName: dto.contactName?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email?.trim().toLowerCase(),
        notes: dto.notes?.trim(),
      },
    });
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto, currentUser: CurrentUser) {
    const existing = await prisma.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        storeId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    await this.ensureProcurementAccess(currentUser, existing.storeId);

    return prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        contactName: dto.contactName?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email?.trim().toLowerCase(),
        notes: dto.notes?.trim(),
        isActive: dto.isActive,
      },
    });
  }

  async getPurchaseReceipts(
    storeId: string,
    query: PaginationQueryDto,
    currentUser: CurrentUser,
  ) {
    await this.ensureStoreAccess(currentUser, storeId);

    const where: Prisma.PurchaseReceiptWhereInput = {
      storeId,
    };

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
        { supplier: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.purchaseReceipt.findMany({
        where,
        include: {
          supplier: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              ingredient: {
                include: {
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      prisma.purchaseReceipt.count({ where }),
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

  async createPurchaseReceipt(dto: CreatePurchaseReceiptDto, currentUser: CurrentUser) {
    await this.ensureProcurementAccess(currentUser, dto.storeId);

    return prisma.$transaction(async (tx) => {
      if (dto.supplierId) {
        const supplier = await tx.supplier.findUnique({
          where: { id: dto.supplierId },
          select: { id: true, storeId: true, isActive: true },
        });

        if (!supplier || supplier.storeId !== dto.storeId) {
          throw new BadRequestException('Supplier not found for this store');
        }

        if (!supplier.isActive) {
          throw new BadRequestException('Supplier is inactive');
        }
      }

      const ingredientIds = dto.items.map((item) => item.ingredientId);
      const ingredients = await tx.ingredient.findMany({
        where: {
          id: { in: ingredientIds },
          storeId: dto.storeId,
        },
        include: { unit: true },
      });

      if (ingredients.length !== ingredientIds.length) {
        throw new BadRequestException('One or more ingredients do not belong to this store');
      }

      const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
      const totalAmount = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      );

      const receipt = await tx.purchaseReceipt.create({
        data: {
          storeId: dto.storeId,
          supplierId: dto.supplierId,
          createdById: currentUser.id,
          invoiceNumber: dto.invoiceNumber?.trim(),
          notes: dto.notes?.trim(),
          totalAmount,
          items: {
            create: dto.items.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.quantity * item.unitCost,
            })),
          },
        },
        include: {
          supplier: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: true,
        },
      });

      for (const item of dto.items) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (!ingredient) continue;

        const nextStock = ingredient.currentStock + item.quantity;
        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: {
            currentStock: nextStock,
            cost: item.unitCost,
          },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: ingredient.id,
            storeId: dto.storeId,
            type: StockMovementType.IN,
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitId: ingredient.stockUnitId,
            reason: 'Satin alma girisi',
            notes: dto.invoiceNumber
              ? `Fatura ${dto.invoiceNumber}`
              : dto.notes?.trim() || 'Mal kabul girisi',
            referenceId: receipt.id,
            createdById: currentUser.id,
            resultingStock: nextStock,
          },
        });

        ingredient.currentStock = nextStock;
      }

      this.eventsGateway.sendToStore(dto.storeId, 'stockMovementCreated', {
        referenceId: receipt.id,
        type: 'PURCHASE_RECEIPT',
        createdAt: receipt.createdAt,
        itemCount: dto.items.length,
      });

      return receipt;
    });
  }

  private async createMovementRecord(
    tx: TransactionClient,
    payload: {
      ingredientId: string;
      storeId: string;
      type: StockMovementType;
      quantity: number;
      unitCost?: number;
      reason?: string;
      notes?: string;
      referenceId?: string;
      createdById?: string;
    },
  ) {
    const ingredient = await tx.ingredient.findUnique({
      where: { id: payload.ingredientId },
      include: { unit: true },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (ingredient.storeId !== payload.storeId) {
      throw new BadRequestException('Ingredient does not belong to the selected store');
    }

    const calculation = this.resolveMovementCalculation(
      payload.type,
      payload.quantity,
      ingredient.currentStock,
    );

    if (
      (payload.type === StockMovementType.OUT || payload.type === StockMovementType.WASTE) &&
      calculation.nextStock < 0
    ) {
      throw new BadRequestException('Stock cannot go below zero for this movement');
    }

    const updatedIngredient = await tx.ingredient.update({
      where: { id: ingredient.id },
      data: {
        currentStock: calculation.nextStock,
        cost: typeof payload.unitCost === 'number' ? payload.unitCost : undefined,
        lastCountedAt: payload.type === StockMovementType.ADJUSTMENT ? new Date() : undefined,
      },
      include: { unit: true },
    });

    const movement = await tx.stockMovement.create({
      data: {
        ingredientId: ingredient.id,
        storeId: payload.storeId,
        type: payload.type,
        quantity: calculation.recordedQuantity,
        unitCost: payload.unitCost,
        unitId: ingredient.stockUnitId,
        reason: this.resolveMovementNote(payload.reason, payload.notes),
        notes: this.resolveMovementNote(payload.notes, payload.reason),
        referenceId: payload.referenceId,
        createdById: payload.createdById,
        resultingStock: calculation.nextStock,
      },
      include: {
        ingredient: {
          include: {
            unit: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      movement,
      updatedIngredient,
    };
  }

  private resolveMovementCalculation(
    type: StockMovementType,
    quantity: number,
    currentStock: number,
  ) {
    if (quantity < 0) {
      throw new BadRequestException('Quantity must be zero or greater');
    }

    if (type === StockMovementType.ADJUSTMENT) {
      const delta = quantity - currentStock;
      return {
        recordedQuantity: delta,
        nextStock: quantity,
      };
    }

    if (type === StockMovementType.OUT || type === StockMovementType.WASTE) {
      return {
        recordedQuantity: quantity,
        nextStock: currentStock - Math.abs(quantity),
      };
    }

    return {
      recordedQuantity: quantity,
      nextStock: currentStock + quantity,
    };
  }

  private resolveMovementNote(primary?: string, fallback?: string) {
    return primary?.trim() || fallback?.trim() || undefined;
  }

  private resolveDateRange(dateFrom?: string, dateTo?: string) {
    const range: Prisma.DateTimeFilter = {};

    if (dateFrom) {
      const nextDate = new Date(dateFrom);
      if (!Number.isNaN(nextDate.getTime())) {
        range.gte = startOfDay(nextDate);
      }
    }

    if (dateTo) {
      const nextDate = new Date(dateTo);
      if (!Number.isNaN(nextDate.getTime())) {
        range.lte = endOfDay(nextDate);
      }
    }

    return Object.keys(range).length > 0 ? range : undefined;
  }

  private emitStockEvents(
    storeId: string,
    ingredient: {
      id: string;
      name: string;
      currentStock: number;
      lowStockThreshold: number;
    },
    movement: {
      id: string;
      ingredientId: string;
      type: StockMovementType;
      quantity: number;
      resultingStock: number | null;
      createdAt: Date;
      reason?: string | null;
      referenceId?: string | null;
    },
  ) {
    this.eventsGateway.sendToStore(storeId, 'stockMovementCreated', {
      id: movement.id,
      ingredientId: movement.ingredientId,
      type: movement.type,
      quantity: movement.quantity,
      resultingStock: movement.resultingStock,
      reason: movement.reason,
      referenceId: movement.referenceId,
      createdAt: movement.createdAt,
    });

    if (ingredient.currentStock <= ingredient.lowStockThreshold) {
      this.eventsGateway.sendToStore(storeId, 'stockLow', {
        ingredientId: ingredient.id,
        name: ingredient.name,
        currentStock: ingredient.currentStock,
        threshold: ingredient.lowStockThreshold,
      });
    }
  }

  private async ensureStoreAccess(
    currentUser: CurrentUser,
    storeId: string,
  ): Promise<{ id: string; organizationId: string; membershipRole?: string }> {
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

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return store;
    }

    if (
      currentUser.role === UserRole.OWNER &&
      currentUser.organizationId &&
      currentUser.organizationId === store.organizationId
    ) {
      return store;
    }

    const membership = currentUser.userStores?.find(
      (item) => item.storeId === storeId && item.isActive,
    );

    if (!membership) {
      throw new ForbiddenException('You do not have access to this store stock');
    }

    return {
      ...store,
      membershipRole: membership.role,
    };
  }

  private async ensureProcurementAccess(currentUser: CurrentUser, storeId: string) {
    const store = await this.ensureStoreAccess(currentUser, storeId);

    if (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.OWNER ||
      store.membershipRole === StoreRole.MANAGER
    ) {
      return store;
    }

    throw new ForbiddenException('You do not have permission to manage procurement');
  }
}
