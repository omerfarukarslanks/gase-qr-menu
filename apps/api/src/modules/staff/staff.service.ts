import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StoreRole, UserRole, prisma } from '@gase/database';
import * as bcrypt from 'bcryptjs';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

type CurrentUser = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

type StaffMembership = Prisma.UserStoreGetPayload<{
  include: {
    user: true;
    store: {
      select: {
        id: true;
        name: true;
        organizationId: true;
      };
    };
  };
}>;

const ACTIVE_ROLE_PRIORITY: Array<StoreRole> = [
  StoreRole.MANAGER,
  StoreRole.STAFF,
  StoreRole.WAITER,
  StoreRole.KITCHEN,
];

@Injectable()
export class StaffService {
  async findAll(storeId: string, currentUser: CurrentUser) {
    await this.ensureStoreManagementAccess(currentUser, storeId);

    const memberships = await prisma.userStore.findMany({
      where: { storeId },
      include: {
        user: true,
        store: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { user: { name: 'asc' } },
      ],
    });

    return memberships.map((membership) => this.mapMembership(membership));
  }

  async create(dto: CreateStaffDto, currentUser: CurrentUser) {
    const actorRole = await this.ensureStoreManagementAccess(currentUser, dto.storeId);
    this.assertRoleManagementAllowed(actorRole, dto.role);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedName = dto.name.trim();

    return prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({
        where: { id: dto.storeId },
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        if (!dto.password) {
          throw new BadRequestException('Password is required for new staff accounts');
        }

        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: normalizedName,
            passwordHash: await bcrypt.hash(dto.password, 12),
            organizationId: store.organizationId,
            role: this.mapStoreRoleToUserRole(dto.role),
          },
        });
      } else {
        if (
          user.organizationId &&
          user.organizationId !== store.organizationId &&
          user.role !== UserRole.SUPER_ADMIN
        ) {
          throw new ConflictException('User belongs to another organization');
        }

        const existingMembership = await tx.userStore.findUnique({
          where: {
            userId_storeId: {
              userId: user.id,
              storeId: dto.storeId,
            },
          },
        });

        if (existingMembership) {
          throw new ConflictException('User is already assigned to this store');
        }
      }

      const membership = await tx.userStore.create({
        data: {
          userId: user.id,
          storeId: dto.storeId,
          role: dto.role,
          isActive: true,
        },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      const nextUserRole = await this.resolveGlobalUserRole(tx, user.id);

      await tx.user.update({
        where: { id: user.id },
        data: {
          name: normalizedName,
          organizationId: user.organizationId ?? store.organizationId,
          role: nextUserRole,
        },
      });

      const refreshedMembership = await tx.userStore.findUnique({
        where: { id: membership.id },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      if (!refreshedMembership) {
        throw new NotFoundException('Staff membership not found');
      }

      return this.mapMembership(refreshedMembership);
    });
  }

  async update(id: string, dto: UpdateStaffDto, currentUser: CurrentUser) {
    const existingMembership = await this.findMembershipOrThrow(id);
    const actorRole = await this.ensureStoreManagementAccess(currentUser, existingMembership.storeId);
    this.assertRoleManagementAllowed(actorRole, dto.role ?? existingMembership.role, existingMembership.role);

    const normalizedEmail = dto.email?.trim().toLowerCase();
    const normalizedName = dto.name?.trim();

    return prisma.$transaction(async (tx) => {
      if (normalizedEmail && normalizedEmail !== existingMembership.user.email) {
        const emailOwner = await tx.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (emailOwner && emailOwner.id !== existingMembership.userId) {
          throw new ConflictException('Email already in use');
        }
      }

      const membership = await tx.userStore.update({
        where: { id },
        data: {
          role: dto.role,
        },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      const currentUserRecord = await tx.user.findUnique({
        where: { id: membership.userId },
        select: { role: true },
      });

      if (!currentUserRecord) {
        throw new NotFoundException('User not found');
      }

      const nextUserRole = await this.resolveGlobalUserRole(tx, membership.userId, currentUserRecord.role);

      await tx.user.update({
        where: { id: membership.userId },
        data: {
          ...(normalizedName ? { name: normalizedName } : {}),
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 12) } : {}),
          role: nextUserRole,
        },
      });

      const refreshedMembership = await tx.userStore.findUnique({
        where: { id: membership.id },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      if (!refreshedMembership) {
        throw new NotFoundException('Staff membership not found');
      }

      return this.mapMembership(refreshedMembership);
    });
  }

  async updateStatus(id: string, isActive: boolean, currentUser: CurrentUser) {
    const existingMembership = await this.findMembershipOrThrow(id);
    const actorRole = await this.ensureStoreManagementAccess(currentUser, existingMembership.storeId);
    this.assertRoleManagementAllowed(actorRole, existingMembership.role, existingMembership.role);

    return prisma.$transaction(async (tx) => {
      const membership = await tx.userStore.update({
        where: { id },
        data: { isActive },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      const currentUserRecord = await tx.user.findUnique({
        where: { id: membership.userId },
        select: { role: true },
      });

      if (!currentUserRecord) {
        throw new NotFoundException('User not found');
      }

      const nextUserRole = await this.resolveGlobalUserRole(tx, membership.userId, currentUserRecord.role);

      await tx.user.update({
        where: { id: membership.userId },
        data: {
          role: nextUserRole,
        },
      });

      const refreshedMembership = await tx.userStore.findUnique({
        where: { id: membership.id },
        include: {
          user: true,
          store: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      if (!refreshedMembership) {
        throw new NotFoundException('Staff membership not found');
      }

      return this.mapMembership(refreshedMembership);
    });
  }

  private async findMembershipOrThrow(id: string) {
    const membership = await prisma.userStore.findUnique({
      where: { id },
      include: {
        user: true,
        store: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Staff membership not found');
    }

    return membership;
  }

  private async ensureStoreManagementAccess(currentUser: CurrentUser, storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return UserRole.SUPER_ADMIN;
    }

    if (
      currentUser.role === UserRole.OWNER &&
      currentUser.organizationId === store.organizationId
    ) {
      return UserRole.OWNER;
    }

    const matchingMembership = currentUser.userStores?.find(
      (membership) => membership.storeId === storeId && membership.isActive,
    );

    if (matchingMembership?.role === StoreRole.MANAGER) {
      return StoreRole.MANAGER;
    }

    throw new ForbiddenException('You do not have permission to manage staff for this store');
  }

  private assertRoleManagementAllowed(
    actorRole: string,
    targetRole: StoreRole,
    existingRole?: StoreRole,
  ) {
    if (actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.OWNER) {
      return;
    }

    if (actorRole === StoreRole.MANAGER) {
      if (targetRole === StoreRole.MANAGER || existingRole === StoreRole.MANAGER) {
        throw new ForbiddenException('Managers cannot manage other managers');
      }

      return;
    }

    throw new ForbiddenException('You do not have permission to manage this staff member');
  }

  private async resolveGlobalUserRole(
    tx: Prisma.TransactionClient,
    userId: string,
    currentRole?: UserRole,
  ) {
    if (currentRole === UserRole.OWNER || currentRole === UserRole.SUPER_ADMIN) {
      return currentRole;
    }

    const memberships = await tx.userStore.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        role: true,
      },
    });

    for (const role of ACTIVE_ROLE_PRIORITY) {
      if (memberships.some((membership) => membership.role === role)) {
        return this.mapStoreRoleToUserRole(role);
      }
    }

    return UserRole.CUSTOMER;
  }

  private mapStoreRoleToUserRole(role: StoreRole) {
    switch (role) {
      case StoreRole.MANAGER:
        return UserRole.MANAGER;
      case StoreRole.STAFF:
        return UserRole.STAFF;
      case StoreRole.WAITER:
        return UserRole.WAITER;
      case StoreRole.KITCHEN:
        return UserRole.KITCHEN;
      default:
        return UserRole.CUSTOMER;
    }
  }

  private mapMembership(membership: StaffMembership) {
    return {
      id: membership.id,
      userId: membership.userId,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      storeId: membership.storeId,
      storeName: membership.store.name,
      isActive: membership.isActive,
    };
  }
}
