import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns connected when MariaDB responds', async () => {
    const prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.getHealth()).resolves.toEqual(
      expect.objectContaining({
        service: 'itkerus-api',
        status: 'ok',
        database: 'connected',
      }),
    );
  });

  it('throws 503 when MariaDB does not respond', async () => {
    const prisma = {
      $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('unavailable')),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
