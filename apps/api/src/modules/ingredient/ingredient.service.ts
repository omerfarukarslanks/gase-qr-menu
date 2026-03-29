import { Injectable, NotFoundException } from '@nestjs/common';
import { IngredientTypeName, prisma } from '@gase/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientService {
  async create(data: CreateIngredientDto) {
    return prisma.ingredient.create({
      data: {
        name: data.name,
        storeId: data.storeId,
        type: data.type ?? IngredientTypeName.OTHER,
        stockUnitId: data.unitId,
        currentStock: data.currentStock || 0,
        lowStockThreshold: data.lowStockThreshold || 0,
        cost: data.cost || 0,
      },
      include: { unit: true },
    });
  }

  async findAll(storeId: string, query: PaginationQueryDto) {
    const where: any = { storeId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        ...query.prismaPagination,
        orderBy: { [query.sortBy || 'name']: query.sortOrder || 'asc' },
        include: { unit: true },
      }),
      prisma.ingredient.count({ where }),
    ]);

    return {
      items,
      meta: query.buildMeta(total),
    };
  }

  async findOne(id: string) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: { unit: true },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    return ingredient;
  }

  async update(id: string, data: UpdateIngredientDto) {
    await this.findOne(id);
    return prisma.ingredient.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        stockUnitId: data.unitId,
        currentStock: data.currentStock,
        lowStockThreshold: data.lowStockThreshold,
        cost: data.cost,
      },
      include: { unit: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.ingredient.delete({ where: { id } });
  }

  async getLowStock(storeId: string) {
    return prisma.ingredient
      .findMany({
      where: {
        storeId,
      },
      include: { unit: true },
      })
      .then((ingredients) =>
        ingredients.filter(
          (ingredient) => ingredient.currentStock <= ingredient.lowStockThreshold,
        ),
      );
  }
}
