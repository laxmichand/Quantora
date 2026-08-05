import { Module } from '@nestjs/common';
import { AngelAuthService } from './angel-auth.service';
import { AngelRestClient } from './angel-rest.client';

@Module({
  providers: [AngelAuthService, AngelRestClient],
  exports: [AngelAuthService, AngelRestClient],
})
export class AngelModule {}
