import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FingerprintService, DeviceFingerprint } from '../fingerprint/fingerprint.service';
import {
  RegisterDeviceDto,
  TrustDeviceDto,
  RenameDeviceDto,
  DeviceResponseDto,
} from './dto/device.dto';

@Injectable()
export class DeviceManagementService {
  private readonly logger = new Logger(DeviceManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fingerprint: FingerprintService,
  ) {}

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
    ip?: string,
    userAgent?: string,
  ): Promise<DeviceResponseDto> {
    // Check if device already exists for this user
    const existing = await this.prisma.device.findUnique({
      where: { deviceId: dto.deviceId },
      include: {
        sessions: { where: { revoked: false }, take: 1, orderBy: { lastActivity: 'desc' } },
      },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Device already registered to another account');
      }
      // Update last activity
      return this.updateDeviceActivity(existing.id, dto, ip, userAgent);
    }

    // Hash the fingerprint
    const fingerprintHash = dto.fingerprint ? this.fingerprint.hash(dto.fingerprint) : null;

    const device = await this.prisma.device.create({
      data: {
        userId,
        deviceId: dto.deviceId,
        fingerprintHash,
        deviceName: dto.fingerprint?.deviceName,
        deviceType: dto.fingerprint?.deviceType,
        browser: dto.fingerprint?.browser,
        browserVersion: dto.fingerprint?.browserVersion,
        engine: dto.fingerprint?.engine,
        engineVersion: dto.fingerprint?.engineVersion,
        os: dto.fingerprint?.os,
        osVersion: dto.fingerprint?.osVersion,
        platform: dto.fingerprint?.platform,
        cpuArchitecture: dto.fingerprint?.cpuArchitecture,
        hostname: dto.fingerprint?.hostname,
        manufacturer: dto.fingerprint?.manufacturer,
        model: dto.fingerprint?.model,
        hardwareConcurrency: dto.fingerprint?.hardwareConcurrency,
        deviceMemory: dto.fingerprint?.deviceMemory,
        screenResolution: dto.fingerprint?.screenResolution,
        viewport: dto.fingerprint?.viewport,
        pixelRatio: dto.fingerprint?.pixelRatio,
        timezone: dto.fingerprint?.timezone,
        language: dto.fingerprint?.language,
        languages: dto.fingerprint?.languages || [],
        publicIp: ip,
        userAgent,
        webglVendor: dto.fingerprint?.webglVendor,
        webglRenderer: dto.fingerprint?.webglRenderer,
        canvasFingerprint: dto.fingerprint?.canvasFingerprint,
        audioFingerprint: dto.fingerprint?.audioFingerprint,
        fontsHash: dto.fingerprint?.fontsHash,
        pluginsHash: dto.fingerprint?.pluginsHash,
        touchSupport: dto.fingerprint?.touchSupport || false,
        cookiesEnabled: dto.fingerprint?.cookiesEnabled || false,
        localStorage: dto.fingerprint?.localStorage || false,
        sessionStorage: dto.fingerprint?.sessionStorage || false,
        batterySupported: dto.fingerprint?.batterySupported || false,
        batteryLevel: dto.fingerprint?.batteryLevel,
        charging: dto.fingerprint?.charging,
        connectionDownlink: dto.fingerprint?.connectionDownlink,
        effectiveNetworkType: dto.fingerprint?.effectiveNetworkType,
        firstLogin: new Date(),
        lastLogin: new Date(),
        lastActivity: new Date(),
        riskLevel: 'low',
      },
    });

    this.logger.log(
      `Device registered: ${device.deviceName || device.deviceId} for user ${userId}`,
    );
    return this.toResponse(device, false);
  }

  private async updateDeviceActivity(
    deviceId: string,
    dto: RegisterDeviceDto,
    ip?: string,
    userAgent?: string,
  ): Promise<DeviceResponseDto> {
    const updateData: any = { lastActivity: new Date() };
    if (ip) updateData.publicIp = ip;
    if (userAgent) updateData.userAgent = userAgent;
    if (dto.fingerprint) {
      updateData.fingerprintHash = this.fingerprint.hash(dto.fingerprint);
    }

    const device = await this.prisma.device.update({
      where: { id: deviceId },
      data: updateData,
      include: {
        sessions: { where: { revoked: false }, orderBy: { lastActivity: 'desc' }, take: 5 },
      },
    });

    return this.toResponse(device, false);
  }

  async getUserDevices(userId: string, currentDeviceId?: string): Promise<DeviceResponseDto[]> {
    const devices = await this.prisma.device.findMany({
      where: { userId, status: { not: 'removed' } },
      orderBy: { lastActivity: 'desc' },
      include: {
        sessions: {
          where: { revoked: false },
          orderBy: { lastActivity: 'desc' },
          take: 1,
        },
      },
    });

    return devices.map((d) => this.toResponse(d, d.id === currentDeviceId));
  }

  async getDevice(userId: string, deviceId: string): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
      include: {
        sessions: { where: { revoked: false }, orderBy: { lastActivity: 'desc' }, take: 5 },
      },
    });
    if (!device) throw new NotFoundException('Device not found');
    return this.toResponse(device, false);
  }

  async trustDevice(
    userId: string,
    deviceId: string,
    dto: TrustDeviceDto,
  ): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        trustedDevice: dto.trusted,
        trustedUntil: dto.trustedUntil
          ? new Date(dto.trustedUntil)
          : dto.trusted
            ? new Date(Date.now() + 365 * 86400000)
            : null,
      },
      include: {
        sessions: { where: { revoked: false }, orderBy: { lastActivity: 'desc' }, take: 1 },
      },
    });

    this.logger.log(`Device ${deviceId} trust set to ${dto.trusted} for user ${userId}`);
    return this.toResponse(updated, false);
  }

  async renameDevice(
    userId: string,
    deviceId: string,
    dto: RenameDeviceDto,
  ): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: { deviceName: dto.name },
      include: {
        sessions: { where: { revoked: false }, orderBy: { lastActivity: 'desc' }, take: 1 },
      },
    });

    return this.toResponse(updated, false);
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');

    // Revoke all sessions for this device
    await this.prisma.session.updateMany({
      where: { deviceId: device.id, revoked: false },
      data: { revoked: true, logoutReason: 'device_removed', logoutTime: new Date() },
    });

    // Soft-delete the device
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { status: 'removed' },
    });

    this.logger.log(`Device ${deviceId} removed for user ${userId}`);
  }

  private toResponse(device: any, isCurrent: boolean): DeviceResponseDto {
    return {
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      browserVersion: device.browserVersion,
      os: device.os,
      osVersion: device.osVersion,
      city: device.city,
      country: device.country,
      publicIp: device.publicIp,
      isp: device.isp,
      trustedDevice: device.trustedDevice,
      trustedUntil: device.trustedUntil,
      riskScore: device.riskScore,
      riskLevel: device.riskLevel,
      firstLogin: device.firstLogin,
      lastLogin: device.lastLogin,
      lastActivity: device.lastActivity,
      loginCount: device.loginCount,
      status: device.status,
      createdAt: device.createdAt,
      sessions: (device.sessions || []).map((s: any) => ({
        id: s.id,
        loginTime: s.loginTime,
        lastActivity: s.lastActivity,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        isCurrent: isCurrent && s.revoked === false,
      })),
    };
  }
}
