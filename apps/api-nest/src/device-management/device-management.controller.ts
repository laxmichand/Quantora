import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { DeviceManagementService } from './device-management.service';
import { RegisterDeviceDto, TrustDeviceDto, RenameDeviceDto } from './dto/device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user-payload.interface';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceManagementController {
  constructor(private readonly deviceService: DeviceManagementService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register device fingerprint' })
  async register(
    @CurrentUser() user: UserPayload,
    @Body() dto: RegisterDeviceDto,
    @Req() req: Request,
  ) {
    return this.deviceService.registerDevice(user.sub, dto, req.ip, req.headers['user-agent']);
  }

  @Get()
  @ApiOperation({ summary: 'List user devices' })
  async listDevices(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const currentDeviceId = (req as any).deviceId;
    return this.deviceService.getUserDevices(user.sub, currentDeviceId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current device' })
  async getCurrentDevice(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const deviceId = (req as any).deviceId;
    if (!deviceId) throw new Error('No device associated with this session');
    return this.deviceService.getDevice(user.sub, deviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  async getDevice(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.deviceService.getDevice(user.sub, id);
  }

  @Patch(':id/trust')
  @ApiOperation({ summary: 'Trust or untrust a device' })
  async trustDevice(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: TrustDeviceDto,
  ) {
    return this.deviceService.trustDevice(user.sub, id, dto);
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename a device' })
  async renameDevice(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: RenameDeviceDto,
  ) {
    return this.deviceService.renameDevice(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a device' })
  async removeDevice(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    await this.deviceService.removeDevice(user.sub, id);
    return { message: 'Device removed' };
  }
}
