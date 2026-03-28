import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class I18nService {
  async getLanguages(storeId: string) {
    const [store, languages] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        select: { defaultLanguage: true, settings: true },
      }),
      prisma.language.findMany({
        orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
      }),
    ]);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const enabledLanguages = this.getEnabledLanguages(store.settings, store.defaultLanguage);

    return languages.map((language) => ({
      id: language.id,
      code: language.code,
      name: language.name,
      isDefault: language.code === store.defaultLanguage,
      isActive: enabledLanguages.includes(language.code),
    }));
  }

  async addLanguage(storeId: string, data: { languageCode: string; name: string; isDefault?: boolean }) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, defaultLanguage: true, settings: true },
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

    const enabledLanguages = this.getEnabledLanguages(store.settings, store.defaultLanguage);
    const nextEnabledLanguages = Array.from(new Set([...enabledLanguages, language.code]));
    const nextSettings = {
      ...this.getStoreSettingsObject(store.settings),
      enabledLanguages: nextEnabledLanguages,
    };

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: nextSettings,
        ...(data.isDefault ? { defaultLanguage: language.code } : {}),
      },
    });

    return {
      id: language.id,
      code: language.code,
      name: language.name,
      isDefault: data.isDefault ? true : language.code === store.defaultLanguage,
      isActive: true,
    };
  }

  async removeLanguage(storeId: string, languageCode: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { defaultLanguage: true, settings: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.defaultLanguage === languageCode.toLowerCase()) {
      throw new NotFoundException('Cannot remove default language');
    }

    const nextEnabledLanguages = this.getEnabledLanguages(store.settings, store.defaultLanguage).filter(
      (code) => code !== languageCode.toLowerCase(),
    );

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: {
          ...this.getStoreSettingsObject(store.settings),
          enabledLanguages: nextEnabledLanguages,
        },
      },
    });

    return { message: 'Language removed from store' };
  }

  async setDefaultLanguage(storeId: string, languageCode: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true, defaultLanguage: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const language = await prisma.language.findUnique({
      where: { code: languageCode.toLowerCase() },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return prisma.store.update({
      where: { id: storeId },
      data: {
        defaultLanguage: language.code,
        settings: {
          ...this.getStoreSettingsObject(store.settings),
          enabledLanguages: Array.from(
            new Set([
              ...this.getEnabledLanguages(store.settings, store.defaultLanguage),
              language.code,
            ]),
          ),
        },
      },
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

  private getStoreSettingsObject(settings: unknown) {
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      return settings as Record<string, unknown>;
    }

    return {};
  }

  private getEnabledLanguages(settings: unknown, defaultLanguage: string) {
    const settingsObject = this.getStoreSettingsObject(settings);
    const rawEnabledLanguages = settingsObject.enabledLanguages;
    const enabledLanguages = Array.isArray(rawEnabledLanguages)
      ? rawEnabledLanguages.filter((value): value is string => typeof value === 'string')
      : [];

    return Array.from(new Set([defaultLanguage, ...enabledLanguages].map((code) => code.toLowerCase())));
  }
}
