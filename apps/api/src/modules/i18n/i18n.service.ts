import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class I18nService {
  async getLanguages(storeId: string) {
    const [store, languages] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        select: { defaultLanguage: true },
      }),
      prisma.language.findMany({
        orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
      }),
    ]);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return languages.map((language) => ({
      id: language.id,
      code: language.code,
      name: language.name,
      isDefault: language.code === store.defaultLanguage,
    }));
  }

  async addLanguage(storeId: string, data: { languageCode: string; name: string; isDefault?: boolean }) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, defaultLanguage: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const language = await prisma.language.findUnique({
      where: { code: data.languageCode.toLowerCase() },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    if (data.isDefault) {
      await prisma.store.update({
        where: { id: storeId },
        data: { defaultLanguage: language.code },
      });
    }

    return {
      id: language.id,
      code: language.code,
      name: language.name,
      isDefault: data.isDefault ? true : language.code === store.defaultLanguage,
    };
  }

  async removeLanguage(storeId: string, languageCode: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { defaultLanguage: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.defaultLanguage === languageCode.toLowerCase()) {
      throw new NotFoundException('Cannot remove default language');
    }

    return { message: 'Store-level language mapping is not persisted in schema; no action needed' };
  }

  async setDefaultLanguage(storeId: string, languageCode: string) {
    const language = await prisma.language.findUnique({
      where: { code: languageCode.toLowerCase() },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return prisma.store.update({
      where: { id: storeId },
      data: { defaultLanguage: language.code },
      select: {
        id: true,
        defaultLanguage: true,
      },
    });
  }

  async getSupportedLanguages() {
    return prisma.language.findMany({
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
  }
}
