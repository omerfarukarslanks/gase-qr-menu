import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Prisma, prisma } from '@gase/database';
import slugify from 'slugify';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { splitDisplayName } from '../../common/utils/language.util';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim();
    const providedOrganizationName =
      dto.organizationName?.trim() ||
      (dto.organizationId && !this.looksLikeEntityId(dto.organizationId)
        ? dto.organizationId.trim()
        : undefined);

    const user = await prisma.$transaction(async (tx) => {
      let organizationId: string | undefined;

      if (dto.organizationId && !providedOrganizationName) {
        const organization = await tx.organization.findUnique({
          where: { id: dto.organizationId },
          select: { id: true },
        });

        if (!organization) {
          throw new BadRequestException('Invalid organizationId');
        }

        organizationId = organization.id;
      }

      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          name: fullName || dto.email,
          phone: dto.phone,
          organizationId,
          role: 'OWNER',
        },
      });

      if (!organizationId && providedOrganizationName) {
        const organization = await tx.organization.create({
          data: {
            name: providedOrganizationName,
            slug: await this.generateUniqueOrganizationSlug(tx, providedOrganizationName),
            ownerId: createdUser.id,
          },
        });

        return tx.user.update({
          where: { id: createdUser.id },
          data: { organizationId: organization.id },
        });
      }

      return createdUser;
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);
    const userName = splitDisplayName(user.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: userName.firstName,
        lastName: userName.lastName,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);
    const userName = splitDisplayName(user.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: userName.firstName,
        lastName: userName.lastName,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role, user.organizationId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId?: string | null,
  ) {
    const payload = { sub: userId, email, role, organizationId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn') || '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn:
          this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private looksLikeEntityId(value: string) {
    return /^c[a-z0-9]{20,}$/i.test(value);
  }

  private async generateUniqueOrganizationSlug(
    tx: Prisma.TransactionClient,
    organizationName: string,
  ) {
    const baseSlug =
      slugify(organizationName, { lower: true, strict: true, trim: true }) ||
      `organization-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;

    while (await tx.organization.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }
}
