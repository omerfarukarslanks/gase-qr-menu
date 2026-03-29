import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { CreateMenuDto, UpdateMenuDto, ToggleMenuCategoryDto, ToggleMenuProductDto } from './dto/menu.dto';
import { PublicMenuFiltersDto } from './dto/public-menu-filters.dto';
import { getStoreOperatingStatus } from '../../common/utils/store-availability.util';

@Injectable()
export class MenuService {
  private pickTranslation(translations: any[], lang?: string, fallback = 'tr') {
    const normalizedLang = lang?.toLowerCase();
    const normalizedFallback = fallback.toLowerCase();

    return (
      translations.find((translation) => translation.language?.code?.toLowerCase() === normalizedLang) ??
      translations.find(
        (translation) => translation.language?.code?.toLowerCase() === normalizedFallback,
      ) ??
      translations[0]
    );
  }

  private formatProduct(product: any, lang?: string, fallbackLanguage = 'tr') {
    const translation = this.pickTranslation(product.translations, lang, fallbackLanguage);
    const operatingStatus =
      product.store?.isActive !== undefined
        ? getStoreOperatingStatus({
            isActive: product.store.isActive,
            settings: product.store.settings,
            timezone: product.store.timezone,
          })
        : undefined;

    return {
      id: product.id,
      name: translation?.name ?? product.slug,
      description: translation?.description ?? null,
      price: product.salePrice,
      images: product.images.map((image: any) => ({
        id: image.id,
        url: image.url,
        order: image.sortOrder,
      })),
      modelUrl: product.model3d?.modelUrl ?? null,
      allergens: product.allergens.map((productAllergen: any) => {
        const allergenTranslation = this.pickTranslation(
          productAllergen.allergen.translations,
          lang,
          fallbackLanguage,
        );

        return {
          id: productAllergen.allergen.id,
          code: productAllergen.allergen.code,
          name: allergenTranslation?.name ?? productAllergen.allergen.code,
          icon: productAllergen.allergen.icon,
        };
      }),
      ingredients: product.ingredients.map((ingredient: any) => ({
        id: ingredient.ingredient.id,
        name: ingredient.ingredient.name,
        isRemovable: ingredient.isRemovable,
      })),
      categoryId: product.categoryId,
      isAvailable: product.isActive,
      operatingStatus,
    };
  }

  private formatCategory(category: any, lang?: string, fallbackLanguage = 'tr') {
    const translation = this.pickTranslation(category.translations, lang, fallbackLanguage);
    const seenProductIds = new Set<string>();
    const products = category.products
      .map((product: any) => this.formatProduct(product, lang, fallbackLanguage))
      .filter((product: any) => {
        if (seenProductIds.has(product.id)) {
          return false;
        }

        seenProductIds.add(product.id);
        return true;
      });

    return {
      id: category.id,
      name: translation?.name ?? category.slug,
      description: translation?.description ?? null,
      icon: undefined,
      order: category.sortOrder,
      products,
    };
  }

  private flattenUniqueCategories(categories: any[], lang?: string, fallbackLanguage = 'tr') {
    const visited = new Set<string>();
    const flattened: ReturnType<MenuService['formatCategory']>[] = [];

    const visit = (category: any) => {
      if (!category || visited.has(category.id)) {
        return;
      }

      visited.add(category.id);
      flattened.push(this.formatCategory(category, lang, fallbackLanguage));

      const sortedChildren = [...(category.children ?? [])].sort(
        (left, right) => left.sortOrder - right.sortOrder,
      );

      sortedChildren.forEach((child) => visit(child));
    };

    categories.forEach((category) => visit(category));

    return flattened;
  }

  private applyProductFilters(products: any[], filters: PublicMenuFiltersDto) {
    const excludedCodes = filters.excludeAllergens
      ? filters.excludeAllergens
          .split(',')
          .map((code) => code.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const normalizedSearch = filters.search?.trim().toLowerCase();

    return products.filter((product) => {
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      if (
        excludedCodes.length > 0 &&
        product.allergens.some((allergen: any) =>
          excludedCodes.includes(allergen.code.toLowerCase()),
        )
      ) {
        return false;
      }

      return true;
    });
  }

  async create(dto: CreateMenuDto) {
    const { categoryIds, ...data } = dto;

    return prisma.menu.create({
      data: {
        ...data,
        qrToken: randomUUID(),
        menuCategories: categoryIds
          ? {
              createMany: {
                data: categoryIds.map((id, index) => ({
                  categoryId: id,
                  sortOrder: index,
                })),
              },
            }
          : undefined,
      },
      include: {
        menuCategories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAll(storeId: string) {
    return prisma.menu.findMany({
      where: { storeId },
      include: {
        menuCategories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        menuCategories: {
          include: {
            category: {
              include: {
                products: {
                  where: { isActive: true },
                  include: {
                    translations: {
                      include: {
                        language: { select: { code: true } },
                      },
                    },
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
                    images: { orderBy: { sortOrder: 'asc' } },
                    model3d: true,
                    ingredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                  orderBy: { sortOrder: 'asc' },
                },
                translations: {
                  include: {
                    language: { select: { code: true } },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        store: true,
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async getPublicMenu(storeId: string) {
    const menu = await prisma.menu.findFirst({
      where: { storeId, isActive: true },
      select: { qrToken: true },
    });

    if (!menu) {
      throw new NotFoundException('No active menu found for this store');
    }

    return this.getMenuByToken(menu.qrToken, {});
  }

  async getMenuByToken(qrToken: string, filters: PublicMenuFiltersDto) {
    const menu = await prisma.menu.findUnique({
      where: { qrToken },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
            defaultLanguage: true,
            timezone: true,
            isActive: true,
            settings: true,
          },
        },
        menuCategories: {
          where: { isActive: true },
          include: {
            category: {
              include: {
                translations: {
                  include: {
                    language: { select: { code: true } },
                  },
                },
                products: {
                  where: { isActive: true },
                  include: {
                    translations: {
                      include: {
                        language: { select: { code: true } },
                      },
                    },
                    images: { orderBy: { sortOrder: 'asc' } },
                    model3d: true,
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
                    ingredients: {
                      include: { ingredient: true },
                    },
                  },
                  orderBy: { sortOrder: 'asc' },
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
                    products: {
                      where: { isActive: true },
                      include: {
                        translations: {
                          include: {
                            language: { select: { code: true } },
                          },
                        },
                        images: { orderBy: { sortOrder: 'asc' } },
                        model3d: true,
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
                        ingredients: {
                          include: { ingredient: true },
                        },
                      },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!menu || !menu.isActive) {
      throw new NotFoundException('Menu not found or inactive');
    }

    const operatingStatus = getStoreOperatingStatus({
      isActive: menu.store.isActive,
      settings: menu.store.settings,
      timezone: menu.store.timezone,
    });

    if (!operatingStatus.isPubliclyVisible || !operatingStatus.isStoreActive) {
      throw new NotFoundException('Menu not found or inactive');
    }

    const fallbackLanguage = menu.store.defaultLanguage || 'tr';
    const lang = filters.lang || fallbackLanguage;
    const table = filters.table
      ? await prisma.restaurantTable.findUnique({
          where: { id: filters.table },
          select: { id: true, name: true },
        })
      : null;

    const selectedCategories = menu.menuCategories.map((menuCategory) => menuCategory.category);
    const selectedCategoryIds = new Set(selectedCategories.map((category) => category.id));
    const rootCategories = selectedCategories.filter(
      (category) => !category.parentId || !selectedCategoryIds.has(category.parentId),
    );

    const flatCategories = this.flattenUniqueCategories(
      rootCategories,
      lang,
      fallbackLanguage,
    );

    const filteredCategories = flatCategories
      .map((category) => ({
        ...category,
        products: this.applyProductFilters(category.products, filters),
      }))
      .filter((category) => {
        if (filters.categoryId && category.id !== filters.categoryId) {
          return false;
        }

        return category.products.length > 0 || !filters.search;
      });

    const allergens = Array.from(
      new Map(
        filteredCategories
          .flatMap((category) => category.products)
          .flatMap((product) => product.allergens)
          .map((allergen) => [allergen.id, allergen]),
      ).values(),
    );

    return {
      id: menu.id,
      name: menu.name,
      slug: menu.qrToken,
      description: menu.description,
      qrToken: menu.qrToken,
      store: {
        ...menu.store,
        tableId: table?.id,
        tableName: table?.name,
        operatingStatus,
      },
      categories: filteredCategories,
      allergens,
    };
  }

  async getPublicProduct(productId: string, lang?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        model3d: true,
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
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
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
        store: {
          select: {
            defaultLanguage: true,
            timezone: true,
            isActive: true,
            settings: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    const operatingStatus = getStoreOperatingStatus({
      isActive: product.store.isActive,
      settings: product.store.settings,
      timezone: product.store.timezone,
    });

    if (!operatingStatus.isPubliclyVisible || !operatingStatus.isStoreActive) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(
      product,
      lang || product.store.defaultLanguage,
      product.store.defaultLanguage,
    );
  }

  async generateQrCode(menuId: string, tableId?: string) {
    const menu = await this.findOne(menuId);
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    let url = `${baseUrl}/m/${menu.qrToken}`;
    if (tableId) {
      url += `?table=${tableId}`;
    }

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    return { url, qrCode: qrDataUrl };
  }

  async update(id: string, dto: UpdateMenuDto) {
    await this.findOne(id);
    const { categoryIds, ...data } = dto;

    if (categoryIds) {
      await prisma.menuCategory.deleteMany({ where: { menuId: id } });
    }

    return prisma.menu.update({
      where: { id },
      data: {
        ...data,
        menuCategories: categoryIds
          ? {
              createMany: {
                data: categoryIds.map((categoryId, index) => ({
                  categoryId,
                  sortOrder: index,
                })),
              },
            }
          : undefined,
      },
      include: {
        menuCategories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async toggleMenuCategory(menuId: string, categoryId: string, dto: ToggleMenuCategoryDto) {
    const menuCategory = await prisma.menuCategory.findUnique({
      where: { menuId_categoryId: { menuId, categoryId } },
    });

    if (!menuCategory) {
      throw new NotFoundException('Menu category not found');
    }

    return prisma.menuCategory.update({
      where: { menuId_categoryId: { menuId, categoryId } },
      data: { isActive: dto.isActive },
      include: { category: true },
    });
  }

  async toggleMenuProduct(menuId: string, productId: string, dto: ToggleMenuProductDto) {
    const menuProduct = await prisma.menuProduct.findUnique({
      where: { menuId_productId: { menuId, productId } },
    });

    if (!menuProduct) {
      throw new NotFoundException('Menu product not found');
    }

    return prisma.menuProduct.update({
      where: { menuId_productId: { menuId, productId } },
      data: {
        isActive: dto.isActive,
        customPrice: dto.customPrice,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.menu.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
