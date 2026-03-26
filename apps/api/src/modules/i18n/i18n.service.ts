import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class I18nService {
  async getLanguages(storeId: string) {
    return prisma.storeLanguage.findMany({
      where: { storeId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async addLanguage(storeId: string, data: { languageCode: string; name: string; isDefault?: boolean }) {
    if (data.isDefault) {
      // Unset other defaults
      await prisma.storeLanguage.updateMany({
        where: { storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.storeLanguage.create({
      data: {
        storeId,
        languageCode: data.languageCode,
        name: data.name,
        isDefault: data.isDefault || false,
      },
    });
  }

  async removeLanguage(storeId: string, languageCode: string) {
    const language = await prisma.storeLanguage.findFirst({
      where: { storeId, languageCode },
    });

    if (!language) {
      throw new NotFoundException('Language not found for this store');
    }

    if (language.isDefault) {
      throw new NotFoundException('Cannot remove default language');
    }

    await prisma.storeLanguage.delete({ where: { id: language.id } });
    return { message: 'Language removed' };
  }

  async setDefaultLanguage(storeId: string, languageCode: string) {
    const language = await prisma.storeLanguage.findFirst({
      where: { storeId, languageCode },
    });

    if (!language) {
      throw new NotFoundException('Language not found for this store');
    }

    await prisma.storeLanguage.updateMany({
      where: { storeId, isDefault: true },
      data: { isDefault: false },
    });

    return prisma.storeLanguage.update({
      where: { id: language.id },
      data: { isDefault: true },
    });
  }

  async getSupportedLanguages() {
    return [
      { code: 'tr', name: 'Turkce' },
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'fr', name: 'Francais' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ru', name: 'Russian' },
      { code: 'es', name: 'Espanol' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
    ];
  }
}
