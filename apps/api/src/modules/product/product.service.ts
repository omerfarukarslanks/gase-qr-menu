import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductService {
  async create(dto: CreateProductDto) {
    const { translations, ingredients, allergenIds, images, ...data } = dto;

    return prisma.product.create({
      data: {
        ...data,
        images: images || [],
        sortOrder: data.sortOrder || 0,
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
        ingredients: ingredients
          ? {
              createMany: {
                data: ingredients.map((i) => ({
                  ingredientId: i.ingredientId,
                  quantity: i.quantity || 1,
                })),
              },
            }
          : undefined,
        allergens: allergenIds
          ? {
              createMany: {
                data: allergenIds.map((id) => ({ allergenId: id })),
              },
            }
          : undefined,
      },
      include: {
        translations: true,
        category: true,
        ingredients: { include: { ingredient: true } },
        allergens: { include: { allergen: true } },
      },
    });
  }

  async findAll(storeId: string, query: PaginationQueryDto & { categoryId?: string }) {
    const where: any = { storeId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: true,
          category: true,
          allergens: { include: { allergen: true } },
        },
      }),
      prisma.product.count({ where }),
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
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        category: true,
        ingredients: { include: { ingredient: { include: { unit: true } } } },
        allergens: { include: { allergen: { include: { translations: true } } } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { translations, ingredients, allergenIds, images, ...data } = dto;

    // Handle images max 5
    if (images && images.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed per product');
    }

    // Delete old relations if updating
    if (translations) {
      await prisma.productTranslation.deleteMany({ where: { productId: id } });
    }
    if (ingredients) {
      await prisma.productIngredient.deleteMany({ where: { productId: id } });
    }
    if (allergenIds) {
      await prisma.productAllergen.deleteMany({ where: { productId: id } });
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(images !== undefined ? { images } : {}),
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
        ingredients: ingredients
          ? {
              createMany: {
                data: ingredients.map((i) => ({
                  ingredientId: i.ingredientId,
                  quantity: i.quantity || 1,
                })),
              },
            }
          : undefined,
        allergens: allergenIds
          ? {
              createMany: {
                data: allergenIds.map((aid) => ({ allergenId: aid })),
              },
            }
          : undefined,
      },
      include: {
        translations: true,
        category: true,
        ingredients: { include: { ingredient: true } },
        allergens: { include: { allergen: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
