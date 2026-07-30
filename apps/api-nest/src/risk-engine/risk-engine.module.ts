import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { IpIntelligenceService } from '../common/services/ip-intelligence.service';

@Module({
  providers: [RiskEngineService, IpIntelligenceService],
  exports: [RiskEngineService, IpIntelligenceService],
})
export class RiskEngineModule {}
