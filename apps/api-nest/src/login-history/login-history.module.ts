import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { LoginHistoryCleanupService } from './login-history-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule],
  providers: [LoginHistoryCleanupService],
})
export class LoginHistoryModule {}
