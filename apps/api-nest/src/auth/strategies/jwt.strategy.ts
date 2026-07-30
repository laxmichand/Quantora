import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { UserPayload } from '../../common/interfaces/user-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: (req: Request | null) => {
        const cookie = req?.cookies?.['_qta'];
        if (cookie) return cookie;
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'quantora-dev-secret',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: UserPayload & { jti?: string; sid?: string; did?: string; type?: string },
  ): Promise<any> {
    // Check if token is blacklisted
    if (payload.jti) {
      const blacklisted = await this.redis.isTokenBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Attach session and device info to request
    if (payload.sid) (req as any).sessionId = payload.sid;
    if (payload.did) (req as any).deviceId = payload.did;

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      sid: payload.sid,
      did: payload.did,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
