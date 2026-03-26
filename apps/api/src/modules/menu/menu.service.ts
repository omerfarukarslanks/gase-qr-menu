import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import * as QRCode from 'qrcode';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
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
                  where: { isActive: true, isAvailable: true },
                  include: {
                    translations: true,
                    allergens: { include: { allergen: true } },
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
          include: {
            category: {
              include: {
                products: {
                  where: { isActive: true, isAvailable: true },
                  include: {
                    translations: true,
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
                      where: { isActive: true, isAvailable: true },
                      include: { translations: true },
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
          select: { id: true, name: true, logo: true, coverImage: true, currency: true },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('No active menu found for this store');
    }

    return menu;
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
