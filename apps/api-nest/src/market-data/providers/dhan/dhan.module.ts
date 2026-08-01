import { Module } from '@nestjs/common';
import { DhanAuthService } from './dhan-auth.service';
import { DhanRestClient } from './dhan-rest.client';

@Module({
  providers: [DhanAuthService, DhanRestClient],
  exports: [DhanAuthService, DhanRestClient],
})
export class DhanModule {}
