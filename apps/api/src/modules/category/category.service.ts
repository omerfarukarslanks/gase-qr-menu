import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoryService {
  async create(dto: CreateCategoryDto) {
    const { translations, ...data } = dto;

    return prisma.category.create({
      data: {
        ...data,
        sortOrder: data.sortOrder || 0,
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
      },
      include: { translations: true, children: true },
    });
  }

  async findAll(storeId: string, query: PaginationQueryDto) {
    const where: any = { storeId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, children: true },
      }),
      prisma.category.count({ where }),
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

  async findTree(storeId: string) {
    return prisma.category.findMany({
      where: { storeId, parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: true,
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: { translations: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { translations: true, children: true, parent: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const { translations, ...data } = dto;

    if (translations) {
      await prisma.categoryTranslation.deleteMany({
        where: { categoryId: id },
      });
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
      },
      include: { translations: true, children: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
