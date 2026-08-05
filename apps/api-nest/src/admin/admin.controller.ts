import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user-payload.interface';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Search sessions' })
  async searchSessions(
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('ip') ip?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.searchSessions({ userId, deviceId, ip, status });
  }

  @Get('devices')
  @ApiOperation({ summary: 'Search devices' })
  async searchDevices(
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('ip') ip?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.searchDevices({ userId, deviceId, ip, status });
  }

  @Post('users/:userId/force-logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force logout a user' })
  async forceLogout(
    @CurrentUser() admin: UserPayload,
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    const count = await this.adminService.forceLogoutUser(admin.sub, userId, reason);
    return { message: `User logged out from ${count} sessions` };
  }

  @Post('devices/:deviceId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a device' })
  async blockDevice(@CurrentUser() admin: UserPayload, @Param('deviceId') deviceId: string) {
    await this.adminService.blockDevice(admin.sub, deviceId);
    return { message: 'Device blocked' };
  }

  @Post('ips/:ip/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block an IP address' })
  async blockIp(@CurrentUser() admin: UserPayload, @Param('ip') ip: string) {
    await this.adminService.blockIp(admin.sub, ip);
    return { message: 'IP blocked' };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('severity') severity?: string,
  ) {
    return this.adminService.getAuditLogs({ userId, action, severity });
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user details with counts' })
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }
}
