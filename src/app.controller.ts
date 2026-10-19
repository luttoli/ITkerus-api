import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      service: 'itkerus-api',
      environment: process.env.APP_ENV ?? 'development',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
