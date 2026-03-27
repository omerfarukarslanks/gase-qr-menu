import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@gase/database';
import { splitDisplayName } from '../../../common/utils/language.util';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'change-me-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userName = splitDisplayName(user.name);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: userName.firstName,
      lastName: userName.lastName,
      name: user.name,
    };
  }
}
