import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const checkedAt = new Date().toISOString();

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');

      return {
        service: 'itkerus-api',
        environment: process.env.APP_ENV ?? 'development',
        status: 'ok',
        database: 'connected',
        checkedAt,
      };
    } catch {
      throw new ServiceUnavailableException({
        service: 'itkerus-api',
        environment: process.env.APP_ENV ?? 'development',
        status: 'unavailable',
        database: 'disconnected',
        checkedAt,
      });
    }
  }
}
