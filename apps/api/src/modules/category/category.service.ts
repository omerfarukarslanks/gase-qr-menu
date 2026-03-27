import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@gase/database';
import slugify from 'slugify';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { mapTranslationsWithLanguageIds } from '../../common/utils/language.util';

@Injectable()
export class CategoryService {
  private async buildTranslations(
    name?: string,
    description?: string,
    translations?: CreateCategoryDto['translations'],
  ) {
    const normalizedTranslations =
      translations && translations.length > 0
        ? translations
        : name
          ? [{ languageCode: 'tr', name, description }]
          : [];

    const mappedTranslations = await mapTranslationsWithLanguageIds(normalizedTranslations);

    if (normalizedTranslations.length !== mappedTranslations.length) {
      throw new BadRequestException('One or more category translations use an unknown language code');
    }

    return mappedTranslations;
  }

  private formatCategory(category: any) {
    const primaryTranslation = category.translations[0];

    return {
      ...category,
      name: primaryTranslation?.name ?? category.slug,
      description: primaryTranslation?.description ?? null,
      translations: category.translations.map((translation: any) => ({
        languageCode: translation.language?.code,
        name: translation.name,
        description: translation.description ?? null,
      })),
      children: category.children?.map((child: any) => this.formatCategory(child)) ?? [],
    };
  }

  async create(dto: CreateCategoryDto) {
    const { translations, name, description, slug, ...data } = dto;
    const mappedTranslations = await this.buildTranslations(name, description, translations);

    const category = await prisma.category.create({
      data: {
        storeId: data.storeId,
        parentId: data.parentId,
        image: data.image,
        sortOrder: data.sortOrder || 0,
        slug:
          slug ||
          slugify(name || mappedTranslations[0]?.name || `category-${Date.now()}`, {
            lower: true,
            strict: true,
          }),
        translations: mappedTranslations.length
          ? { createMany: { data: mappedTranslations } }
          : undefined,
      },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        children: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    return this.formatCategory(category);
  }

  async findAll(storeId: string, query: PaginationQueryDto) {
    const where: any = { storeId };

    if (query.search) {
      where.translations = {
        some: {
          name: { contains: query.search, mode: 'insensitive' },
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          translations: {
            include: {
              language: { select: { code: true } },
            },
          },
          children: {
            include: {
              translations: {
                include: {
                  language: { select: { code: true } },
                },
              },
            },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatCategory(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async findTree(storeId: string) {
    const categories = await prisma.category.findMany({
      where: { storeId, parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                translations: {
                  include: {
                    language: { select: { code: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return categories.map((category) => this.formatCategory(category));
  }

  async findOne(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        children: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
        parent: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...this.formatCategory(category),
      parent: category.parent ? this.formatCategory(category.parent) : null,
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const { translations, name, description, slug, ...data } = dto;

    const shouldReplaceTranslations =
      Boolean(translations && translations.length > 0) ||
      typeof name === 'string' ||
      typeof description === 'string';

    if (shouldReplaceTranslations) {
      await prisma.categoryTranslation.deleteMany({
        where: { categoryId: id },
      });
    }

    const mappedTranslations = shouldReplaceTranslations
      ? await this.buildTranslations(name, description, translations)
      : [];

    const category = await prisma.category.update({
      where: { id },
      data: {
        parentId: data.parentId,
        image: data.image,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        slug:
          slug ||
          (name
            ? slugify(name, {
                lower: true,
                strict: true,
              })
            : undefined),
        translations: shouldReplaceTranslations
          ? {
              createMany: {
                data: mappedTranslations,
              },
            }
          : undefined,
      },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        children: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    return this.formatCategory(category);
  }

  async remove(id: string) {
    await this.findOne(id);

    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
