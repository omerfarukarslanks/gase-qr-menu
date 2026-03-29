import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@gase/database';
import type { MobilePushPayload } from '@gase/shared';
import { RegisterMobileDeviceDto } from './dto/mobile-device.dto';

type CurrentUser = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class MobileDeviceService {
  private readonly logger = new Logger(MobileDeviceService.name);

  async register(currentUser: CurrentUser, dto: RegisterMobileDeviceDto) {
    const storeId = dto.storeId?.trim() || null;

    if (storeId) {
      await this.assertStoreAccess(currentUser, storeId);
    }

    return prisma.mobileDevice.upsert({
      where: {
        userId_deviceId: {
          userId: currentUser.id,
          deviceId: dto.deviceId,
        },
      },
      create: {
        userId: currentUser.id,
        storeId,
        deviceId: dto.deviceId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
        appVersion: dto.appVersion?.trim() || null,
        buildNumber: dto.buildNumber?.trim() || null,
        isActive: true,
      },
      update: {
        storeId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
        appVersion: dto.appVersion?.trim() || null,
        buildNumber: dto.buildNumber?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async unregister(userId: string, deviceId: string) {
    await prisma.mobileDevice.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        isActive: false,
        lastSeenAt: new Date(),
      },
    });

    return { success: true };
  }

  async notifyNewOrder(storeId: string, orderNumber: number, tableName: string) {
    return this.notifyStoreUsers(storeId, {
      title: 'Yeni siparis',
      body: `#${String(orderNumber).padStart(3, '0')} ${tableName} icin yeni siparis geldi.`,
      sound: 'default',
      storeId,
      data: {
        route: '/store/orders',
        orderNumber,
        tableName,
      },
    });
  }

  async notifyOrderReady(storeId: string, orderNumber: number, tableName: string) {
    return this.notifyStoreUsers(storeId, {
      title: 'Siparis hazir',
      body: `#${String(orderNumber).padStart(3, '0')} ${tableName} siparisi servise hazir.`,
      sound: 'default',
      storeId,
      data: {
        route: '/store/kitchen',
        orderNumber,
        tableName,
      },
    });
  }

  async notifyWaiterCall(storeId: string, tableName?: string | null) {
    return this.notifyStoreUsers(storeId, {
      title: 'Garson cagrisi',
      body: `${tableName || 'Bir masa'} garson cagiriyor.`,
      sound: 'default',
      storeId,
      data: {
        route: '/store/tables',
        tableName,
      },
    });
  }

  async notifyStoreUsers(storeId: string, payload: MobilePushPayload) {
    const devices = await prisma.mobileDevice.findMany({
      where: {
        storeId,
        isActive: true,
      },
      select: {
        expoPushToken: true,
      },
    });

    const tokens = Array.from(
      new Set(
        devices
          .map((device) => device.expoPushToken)
          .filter((token) => this.isExpoPushToken(token)),
      ),
    );

    if (tokens.length === 0) {
      return { sent: 0 };
    }

    const messages: ExpoMessage[] = tokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      sound: payload.sound === 'default' ? 'default' : undefined,
      data: payload.data,
    }));

    await this.send(messages);
    return { sent: messages.length };
  }

  private async send(messages: ExpoMessage[]) {
    const chunks = this.chunk(messages, 100);

    for (const chunk of chunks) {
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          this.logger.warn(`Expo push request failed with status ${response.status}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown push error';
        this.logger.warn(`Expo push request failed: ${message}`);
      }
    }
  }

  private async assertStoreAccess(currentUser: CurrentUser, storeId: string) {
    if (currentUser.role === 'SUPER_ADMIN') {
      return;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (
      currentUser.role === 'OWNER' &&
      currentUser.organizationId &&
      currentUser.organizationId === store.organizationId
    ) {
      return;
    }

    const hasMembership = currentUser.userStores?.some(
      (membership) => membership.storeId === storeId && membership.isActive,
    );

    if (!hasMembership) {
      throw new ForbiddenException('Store access denied');
    }
  }

  private isExpoPushToken(value: string) {
    return /^ExponentPushToken\[.+\]$/.test(value) || /^ExpoPushToken\[.+\]$/.test(value);
  }

  private chunk<T>(items: T[], size: number) {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }
}
