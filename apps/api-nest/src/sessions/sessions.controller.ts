import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user-payload.interface';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active sessions' })
  async getSessions(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const currentSessionId = (req as any).sessionId;
    return this.sessionsService.getSessions(user.sub, currentSessionId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current session' })
  async getCurrentSession(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const sessionId = (req as any).sessionId;
    return this.sessionsService.getCurrentSession(user.sub, sessionId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  async logoutCurrent(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const sessionId = (req as any).sessionId;
    const refreshToken = req.cookies?._qtr;
    await this.sessionsService.logoutCurrentSession(user.sub, sessionId, refreshToken);
    return { message: 'Logged out' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all sessions' })
  async logoutAll(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const sessionId = (req as any).sessionId;
    const count = await this.sessionsService.logoutAllSessions(user.sub, sessionId);
    return { message: `Logged out from ${count} other sessions` };
  }

  @Post('logout-others')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all other sessions' })
  async logoutOthers(@CurrentUser() user: UserPayload, @Req() req: Request) {
    const sessionId = (req as any).sessionId;
    const count = await this.sessionsService.logoutOtherSessions(user.sub, sessionId);
    return { message: `Logged out from ${count} other sessions` };
  }

  @Post('logout-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all sessions for a specific device' })
  async logoutDevice(
    @CurrentUser() user: UserPayload,
    @Body('deviceId') deviceId: string,
    @Req() req: Request,
  ) {
    const sessionId = (req as any).sessionId;
    const count = await this.sessionsService.logoutDeviceSessions(user.sub, deviceId, sessionId);
    return { message: `Logged out from ${count} device sessions` };
  }

  @Post(':id/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout a specific session' })
  async logoutSession(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    await this.sessionsService.logoutSession(user.sub, id);
    return { message: 'Session logged out' };
  }
}
