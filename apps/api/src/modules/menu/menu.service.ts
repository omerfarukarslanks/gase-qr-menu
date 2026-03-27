import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import * as QRCode from 'qrcode';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
import { PublicMenuFiltersDto } from './dto/public-menu-filters.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MenuService {
  constructor(private configService: ConfigService) {}

  async create(dto: CreateMenuDto) {
    const { categoryIds, ...data } = dto;

    return prisma.menu.create({
      data: {
        ...data,
        categories: categoryIds
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
        categories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAll(storeId: string) {
    return prisma.menu.findMany({
      where: { storeId },
      include: {
        categories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: {
              include: {
                products: {
                  where: { isActive: true },
                  include: {
                    translations: true,
                    allergens: { include: { allergen: true } },
                    images: { orderBy: { sortOrder: 'asc' } },
                  },
                  orderBy: { sortOrder: 'asc' },
                },
                translations: true,
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
      include: {
        categories: {
          where: { isActive: true },
          include: {
            category: {
              include: {
                products: {
                  where: { isActive: true },
                  include: {
                    translations: true,
                    images: { orderBy: { sortOrder: 'asc' } },
                    allergens: { include: { allergen: { include: { translations: true } } } },
                  },
                  orderBy: { sortOrder: 'asc' },
                },
                translations: true,
                children: {
                  where: { isActive: true },
                  include: {
                    translations: true,
                    products: {
                      where: { isActive: true },
                      include: {
                        translations: true,
                        images: { orderBy: { sortOrder: 'asc' } },
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
        store: {
          select: { id: true, name: true, logo: true, slug: true, defaultLanguage: true },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('No active menu found for this store');
    }

    return menu;
  }

  async getMenuByToken(qrToken: string, filters: PublicMenuFiltersDto) {
    // Find menu by qrToken
    const menu = await prisma.menu.findUnique({
      where: { qrToken },
      include: {
        store: {
          select: { id: true, name: true, logo: true, slug: true, defaultLanguage: true },
        },
      },
    });

    if (!menu || !menu.isActive) {
      throw new NotFoundException('Menu not found or inactive');
    }

    // Build product where clause based on filters
    const productWhere: any = { isActive: true };

    if (filters.minPrice !== undefined) {
      productWhere.salePrice = { ...productWhere.salePrice, gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      productWhere.salePrice = { ...productWhere.salePrice, lte: filters.maxPrice };
    }

    // Allergen exclusion: find allergen IDs by code
    let excludeAllergenIds: string[] = [];
    if (filters.excludeAllergens) {
      const codes = filters.excludeAllergens.split(',').map((c) => c.trim().toUpperCase());
      const allergens = await prisma.allergen.findMany({
        where: { code: { in: codes } },
        select: { id: true },
      });
      excludeAllergenIds = allergens.map((a) => a.id);
    }

    // Search filter: search in translations
    let searchProductIds: string[] | undefined;
    if (filters.search) {
      const matchingTranslations = await prisma.productTranslation.findMany({
        where: {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
        select: { productId: true },
      });
      searchProductIds = matchingTranslations.map((t) => t.productId);
    }

    // Build category filter
    const categoryWhere: any = { isActive: true };
    if (filters.categoryId) {
      categoryWhere.categoryId = filters.categoryId;
    }

    // Fetch menu categories with products
    const menuCategories = await prisma.menuCategory.findMany({
      where: {
        menuId: menu.id,
        ...categoryWhere,
      },
      include: {
        category: {
          include: {
            translations: true,
            products: {
              where: {
                ...productWhere,
                ...(searchProductIds !== undefined ? { id: { in: searchProductIds } } : {}),
              },
              include: {
                translations: true,
                images: { orderBy: { sortOrder: 'asc' } },
                allergens: { include: { allergen: { include: { translations: true } } } },
                ingredients: {
                  include: { ingredient: true, unit: true },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
            children: {
              where: { isActive: true },
              include: {
                translations: true,
                products: {
                  where: {
                    ...productWhere,
                    ...(searchProductIds !== undefined ? { id: { in: searchProductIds } } : {}),
                  },
                  include: {
                    translations: true,
                    images: { orderBy: { sortOrder: 'asc' } },
                    allergens: { include: { allergen: { include: { translations: true } } } },
                    ingredients: {
                      include: { ingredient: true, unit: true },
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
    });

    // Filter out products that contain excluded allergens
    const categories = menuCategories.map((mc) => {
      const category = mc.category;
      const filteredProducts = this.filterAllergens(category.products, excludeAllergenIds);
      const filteredChildren = category.children.map((child) => ({
        ...child,
        products: this.filterAllergens(child.products, excludeAllergenIds),
      }));

      return {
        ...category,
        products: filteredProducts,
        children: filteredChildren,
        sortOrder: mc.sortOrder,
        isActive: mc.isActive,
      };
    });

    return {
      id: menu.id,
      name: menu.name,
      description: menu.description,
      qrToken: menu.qrToken,
      store: menu.store,
      categories,
    };
  }

  async getPublicProduct(productId: string, lang?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        images: { orderBy: { sortOrder: 'asc' } },
        model3d: true,
        allergens: { include: { allergen: { include: { translations: true } } } },
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
        },
        category: {
          include: { translations: true },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private filterAllergens(products: any[], excludeAllergenIds: string[]): any[] {
    if (excludeAllergenIds.length === 0) return products;

    return products.filter((product) => {
      const productAllergenIds = product.allergens.map((pa: any) => pa.allergen.id);
      return !productAllergenIds.some((id: string) => excludeAllergenIds.includes(id));
    });
  }

  async generateQrCode(menuId: string, tableId?: string) {
    const menu = await this.findOne(menuId);
    const baseUrl = this.configService.get<string>('app.corsOrigins')?.[0] || 'http://localhost:3000';

    let url = `${baseUrl}/menu/${menu.storeId}`;
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
        categories: categoryIds
          ? {
              createMany: {
                data: categoryIds.map((cid, index) => ({
                  categoryId: cid,
                  sortOrder: index,
                })),
              },
            }
          : undefined,
      },
      include: {
        categories: { include: { category: true }, orderBy: { sortOrder: 'asc' } },
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
