import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityAuditModule } from '../security-audit/security-audit.module';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'quantora-dev-secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    PrismaModule,
    SecurityAuditModule,
    NotificationsModule,
    RiskEngineModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy, SecurityAuditService],
  exports: [AuthService],
})
export class AuthModule {}
