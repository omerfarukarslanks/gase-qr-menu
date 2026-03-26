import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

@Injectable()
export class TableService {
  async create(dto: CreateTableDto) {
    return prisma.table.create({
      data: {
        name: dto.name,
        storeId: dto.storeId,
        section: dto.section,
        capacity: dto.capacity || 4,
      },
    });
  }

  async findAll(storeId: string) {
    return prisma.table.findMany({
      where: { storeId, isActive: true },
      orderBy: [{ section: 'asc' }, { name: 'asc' }],
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { startedAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { orders: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return prisma.table.update({ where: { id }, data: dto });
  }

  async openSession(tableId: string, customerSessionId?: string) {
    const table = await this.findOne(tableId);

    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId, status: 'ACTIVE' },
    });

    if (activeSession) {
      throw new BadRequestException('Table already has an active session');
    }

    const session = await prisma.tableSession.create({
      data: {
        tableId,
        storeId: table.storeId,
        status: 'ACTIVE',
        customerSessionId,
      },
    });

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' },
    });

    return session;
  }

  async closeSession(sessionId: string) {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endedAt: new Date() },
    });

    await prisma.table.update({
      where: { id: session.tableId },
      data: { status: 'AVAILABLE' },
    });

    return { message: 'Session closed' };
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
