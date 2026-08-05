import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getStatus() {
    return {
      name: 'Quantora Backend',
      version: '0.0.1',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}
