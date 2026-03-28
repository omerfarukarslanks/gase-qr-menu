import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TableStatus, UserRole, prisma } from '@gase/database';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

type CurrentUser = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

@Injectable()
export class TableService {
  async create(dto: CreateTableDto) {
    return prisma.restaurantTable.create({
      data: {
        name: dto.name,
        number: dto.number,
        storeId: dto.storeId,
        section: dto.section,
        capacity: dto.capacity || 4,
      },
    });
  }

  async findAll(storeId: string) {
    return prisma.restaurantTable.findMany({
      where: { storeId },
      orderBy: [{ section: 'asc' }, { number: 'asc' }],
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { openedAt: 'desc' },
          include: {
            assignedStaff: {
              select: {
                id: true,
                name: true,
              },
            },
            orders: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
              },
              select: { id: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const table = await prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            orders: true,
            assignedStaff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return prisma.restaurantTable.update({
      where: { id },
      data: {
        name: dto.name,
        section: dto.section,
        capacity: dto.capacity,
        status: dto.status as TableStatus | undefined,
      },
    });
  }

  async openSession(
    tableId: string,
    customerName?: string,
    customerPhone?: string,
    assignedStaffUserId?: string,
    currentUser?: CurrentUser | null,
  ) {
    const table = await this.findOne(tableId);

    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId, status: 'ACTIVE' },
    });

    if (activeSession) {
      throw new BadRequestException('Table already has an active session');
    }

    const resolvedAssignedStaffUserId = await this.resolveAssignedStaffUserId(
      table.storeId,
      assignedStaffUserId,
      currentUser,
    );

    const session = await prisma.tableSession.create({
      data: {
        tableId,
        status: 'ACTIVE',
        customerName,
        customerPhone,
        assignedStaffUserId: resolvedAssignedStaffUserId,
      },
      include: {
        assignedStaff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        currentSessionId: session.id,
      },
    });

    return session;
  }

  async getOrCreatePublicSession(tableId: string) {
    await this.findOne(tableId);

    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId, status: 'ACTIVE' },
      orderBy: { openedAt: 'desc' },
    });

    if (activeSession) {
      return activeSession;
    }

    return this.openSession(tableId);
  }

  async closeSession(sessionId: string) {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    await prisma.restaurantTable.update({
      where: { id: session.tableId },
      data: {
        status: 'AVAILABLE',
        currentSessionId: null,
      },
    });

    return { message: 'Session closed' };
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.restaurantTable.update({
      where: { id },
      data: { status: 'OUT_OF_SERVICE' },
    });
  }

  private async resolveAssignedStaffUserId(
    storeId: string,
    assignedStaffUserId?: string,
    currentUser?: CurrentUser | null,
  ) {
    const candidateUserId = assignedStaffUserId || currentUser?.id;

    if (!candidateUserId) {
      return null;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        organizationId: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
        userStores: {
          where: {
            storeId,
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Assigned staff user not found');
    }

    const isOrganizationOwner =
      user.role === UserRole.OWNER && user.organizationId === store.organizationId;

    if (!isOrganizationOwner && user.userStores.length === 0 && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Assigned staff user does not have access to this store');
    }

    return user.id;
  }
}
