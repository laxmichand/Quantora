import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceFingerprint } from '../../fingerprint/fingerprint.service';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Client-generated unique device ID' })
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fingerprint?: Partial<DeviceFingerprint>;
}

export class TrustDeviceDto {
  @ApiProperty({ description: 'Trust this device until' })
  @IsOptional()
  trustedUntil?: string;

  @ApiProperty()
  @IsBoolean()
  trusted: boolean;
}

export class RenameDeviceDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class DeviceResponseDto {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  city?: string;
  country?: string;
  publicIp?: string;
  isp?: string;
  trustedDevice: boolean;
  trustedUntil?: Date;
  riskScore: number;
  riskLevel: string;
  firstLogin?: Date;
  lastLogin?: Date;
  lastActivity?: Date;
  loginCount: number;
  status: string;
  createdAt: Date;
  sessions: { id: string; lastActivity: Date; isCurrent: boolean }[];
}
