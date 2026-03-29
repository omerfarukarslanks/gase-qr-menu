import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@gase/database';
import slugify from 'slugify';
import {
  CreateProductDto,
  ProductListQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { mapTranslationsWithLanguageIds } from '../../common/utils/language.util';

@Injectable()
export class ProductService {
  private async resolveUnitId(storeId: string, unitId?: string) {
    if (unitId) {
      return unitId;
    }

    const fallbackUnit = await prisma.unit.findFirst({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!fallbackUnit) {
      throw new BadRequestException(
        'Product creation requires a unitId or at least one unit in the store',
      );
    }

    return fallbackUnit.id;
  }

  private async buildTranslations(
    name?: string,
    description?: string,
    translations?: CreateProductDto['translations'],
  ) {
    const normalizedTranslations =
      translations && translations.length > 0
        ? translations
        : name
          ? [{ languageCode: 'tr', name, description }]
          : [];

    const mappedTranslations = await mapTranslationsWithLanguageIds(
      normalizedTranslations,
    );

    if (normalizedTranslations.length !== mappedTranslations.length) {
      throw new BadRequestException(
        'One or more product translations use an unknown language code',
      );
    }

    return mappedTranslations;
  }

  private buildImageRecords(images?: string[], coverImage?: string) {
    const orderedImages = Array.from(
      new Set(
        [...(coverImage ? [coverImage] : []), ...(images ?? [])].filter(Boolean),
      ),
    ) as string[];

    return orderedImages.map((url, index) => ({
      url,
      thumbnailUrl: url,
      isCover: coverImage ? url === coverImage : index === 0,
      sortOrder: index,
    }));
  }

  private formatProduct(product: any) {
    const primaryTranslation = product.translations[0];
    const coverImage =
      product.images.find((image: any) => image.isCover) ?? product.images[0];

    return {
      id: product.id,
      storeId: product.storeId,
      categoryId: product.categoryId,
      unitId: product.unitId,
      slug: product.slug,
      name: primaryTranslation?.name ?? product.slug,
      description: primaryTranslation?.description ?? null,
      price: product.salePrice,
      costPrice: product.costPrice,
      currency: product.currency,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      preparationTime: product.preparationTime,
      images: product.images.map((image: any) => image.url),
      coverImage: coverImage?.url ?? null,
      model3dUrl: product.model3d?.modelUrl ?? null,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.translations?.[0]?.name ?? product.category.slug,
          }
        : null,
      allergens: product.allergens.map((productAllergen: any) => ({
        id: productAllergen.allergen.id,
        code: productAllergen.allergen.code,
        name:
          productAllergen.allergen.translations?.[0]?.name ??
          productAllergen.allergen.code,
      })),
      ingredients: product.ingredients.map((ingredient: any) => ({
        id: ingredient.ingredient.id,
        name: ingredient.ingredient.name,
        quantity: ingredient.quantity ?? 1,
        isRemovable: ingredient.isRemovable,
      })),
      translations: product.translations.map((translation: any) => ({
        languageCode: translation.language?.code,
        name: translation.name,
        description: translation.description ?? null,
      })),
    };
  }

  async create(dto: CreateProductDto) {
    const {
      translations,
      ingredients,
      allergenIds,
      images,
      coverImage,
      model3dUrl,
      name,
      description,
      price,
      costPrice,
      unitId,
      slug,
      currency,
      ...data
    } = dto;

    const resolvedUnitId = await this.resolveUnitId(dto.storeId, unitId);
    const mappedTranslations = await this.buildTranslations(
      name,
      description,
      translations,
    );
    const imageRecords = this.buildImageRecords(images, coverImage);

    const product = await prisma.product.create({
      data: {
        storeId: data.storeId,
        categoryId: data.categoryId,
        unitId: resolvedUnitId,
        slug:
          slug ||
          slugify(name || mappedTranslations[0]?.name || `product-${Date.now()}`, {
            lower: true,
            strict: true,
          }),
        costPrice: costPrice ?? price,
        salePrice: price,
        currency: currency || 'TRY',
        sortOrder: data.sortOrder || 0,
        preparationTime: data.preparationTime,
        translations: mappedTranslations.length
          ? { createMany: { data: mappedTranslations } }
          : undefined,
        images: imageRecords.length
          ? {
              createMany: {
                data: imageRecords,
              },
            }
          : undefined,
        model3d: model3dUrl
          ? {
              create: {
                modelUrl: model3dUrl,
                thumbnailUrl: coverImage || imageRecords[0]?.url,
              },
            }
          : undefined,
        ingredients: ingredients
          ? {
              createMany: {
                data: ingredients.map((ingredient) => ({
                  ingredientId: ingredient.ingredientId,
                  quantity: ingredient.quantity || 1,
                  isRemovable: ingredient.isRemovable ?? false,
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
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        category: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        model3d: true,
        ingredients: { include: { ingredient: true } },
        allergens: {
          include: {
            allergen: {
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

    return this.formatProduct(product);
  }

  async findAll(
    storeId: string,
    query: ProductListQueryDto,
  ) {
    const where: any = { storeId };

    if (query.search) {
      where.translations = {
        some: {
          name: { contains: query.search, mode: 'insensitive' },
        },
      };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
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
          category: {
            include: {
              translations: {
                include: {
                  language: { select: { code: true } },
                },
              },
            },
          },
          images: { orderBy: { sortOrder: 'asc' } },
          model3d: true,
          ingredients: { include: { ingredient: true } },
          allergens: {
            include: {
              allergen: {
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
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatProduct(item)),
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
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        category: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        model3d: true,
        ingredients: { include: { ingredient: { include: { unit: true } } } },
        allergens: {
          include: {
            allergen: {
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

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { storeId: true },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const {
      translations,
      ingredients,
      allergenIds,
      images,
      coverImage,
      model3dUrl,
      name,
      description,
      price,
      costPrice,
      unitId,
      slug,
      currency,
      ...data
    } = dto;

    if (images && images.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed per product');
    }

    if (translations || typeof name === 'string' || typeof description === 'string') {
      await prisma.productTranslation.deleteMany({ where: { productId: id } });
    }
    if (ingredients) {
      await prisma.productIngredient.deleteMany({ where: { productId: id } });
    }
    if (allergenIds) {
      await prisma.productAllergen.deleteMany({ where: { productId: id } });
    }
    if (images || coverImage) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }

    const mappedTranslations =
      translations || typeof name === 'string' || typeof description === 'string'
        ? await this.buildTranslations(name, description, translations)
        : [];
    const imageRecords =
      images || coverImage ? this.buildImageRecords(images, coverImage) : [];

    const product = await prisma.product.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        unitId: unitId
          ? await this.resolveUnitId(existingProduct.storeId, unitId)
          : undefined,
        slug:
          slug ||
          (name
            ? slugify(name, {
                lower: true,
                strict: true,
              })
            : undefined),
        costPrice,
        salePrice: price,
        currency,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        preparationTime: data.preparationTime,
        translations:
          translations || typeof name === 'string' || typeof description === 'string'
            ? { createMany: { data: mappedTranslations } }
            : undefined,
        images:
          images || coverImage
            ? {
                createMany: {
                  data: imageRecords,
                },
              }
            : undefined,
        model3d: model3dUrl
          ? {
              upsert: {
                create: {
                  modelUrl: model3dUrl,
                  thumbnailUrl: coverImage || imageRecords[0]?.url,
                },
                update: {
                  modelUrl: model3dUrl,
                  thumbnailUrl: coverImage || imageRecords[0]?.url,
                },
              },
            }
          : undefined,
        ingredients: ingredients
          ? {
              createMany: {
                data: ingredients.map((ingredient) => ({
                  ingredientId: ingredient.ingredientId,
                  quantity: ingredient.quantity || 1,
                  isRemovable: ingredient.isRemovable ?? false,
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
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        category: {
          include: {
            translations: {
              include: {
                language: { select: { code: true } },
              },
            },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        model3d: true,
        ingredients: { include: { ingredient: true } },
        allergens: {
          include: {
            allergen: {
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

    return this.formatProduct(product);
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
