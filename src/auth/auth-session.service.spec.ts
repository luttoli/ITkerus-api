import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { JwtConfigService } from './jwt-config.service';

describe('AuthSessionService', () => {
  let capturedCreateInput: Prisma.RefreshSessionCreateArgs | undefined;
  let capturedTransactionCreateInput:
    Prisma.RefreshSessionCreateArgs | undefined;
  let capturedUpdateInput: Prisma.RefreshSessionUpdateManyArgs | undefined;
  let capturedTransactionUpdateInput:
    Prisma.RefreshSessionUpdateManyArgs | undefined;
  const create =
    jest.fn<(input: Prisma.RefreshSessionCreateArgs) => Promise<unknown>>();
  const findUnique =
    jest.fn<(input: Prisma.RefreshSessionFindUniqueArgs) => Promise<unknown>>();
  const updateMany =
    jest.fn<
      (input: Prisma.RefreshSessionUpdateManyArgs) => Promise<{ count: number }>
    >();
  const transactionCreate =
    jest.fn<(input: Prisma.RefreshSessionCreateArgs) => Promise<unknown>>();
  const transactionUpdateMany =
    jest.fn<
      (input: Prisma.RefreshSessionUpdateManyArgs) => Promise<{ count: number }>
    >();
  const transactionClient = {
    refreshSession: {
      create: transactionCreate,
      updateMany: transactionUpdateMany,
    },
  };
  const runTransaction = jest.fn(
    (operation: (transaction: typeof transactionClient) => Promise<boolean>) =>
      operation(transactionClient),
  );
  const prisma = {
    refreshSession: { create, findUnique, updateMany },
    $transaction: runTransaction,
  } as unknown as PrismaService;
  const authTokenService = {
    issueAccessToken: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    }),
  } as unknown as AuthTokenService;
  const jwtConfig = {
    refresh: { expiresInSeconds: 7776000 },
  } as JwtConfigService;
  const service = new AuthSessionService(prisma, authTokenService, jwtConfig);

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCreateInput = undefined;
    capturedTransactionCreateInput = undefined;
    capturedUpdateInput = undefined;
    capturedTransactionUpdateInput = undefined;
    create.mockImplementation((input: Prisma.RefreshSessionCreateArgs) => {
      capturedCreateInput = input;
      return Promise.resolve({});
    });
    transactionCreate.mockImplementation(
      (input: Prisma.RefreshSessionCreateArgs) => {
        capturedTransactionCreateInput = input;
        return Promise.resolve({});
      },
    );
    transactionUpdateMany.mockImplementation(
      (input: Prisma.RefreshSessionUpdateManyArgs) => {
        capturedTransactionUpdateInput = input;
        return Promise.resolve({ count: 1 });
      },
    );
    updateMany.mockImplementation(
      (input: Prisma.RefreshSessionUpdateManyArgs) => {
        capturedUpdateInput = input;
        return Promise.resolve({ count: 1 });
      },
    );
  });

  it('issues an opaque refresh token and stores only its hash', async () => {
    const response = await service.issueSession(1);

    expect(response.refreshToken).toHaveLength(43);
    expect(response.refreshExpiresInSeconds).toBe(7776000);
    const createdData = capturedCreateInput?.data as
      | {
          userId?: number;
          familyId?: string;
          tokenHash?: string;
          expiresAt?: Date;
        }
      | undefined;
    expect(createdData?.userId).toBe(1);
    expect(typeof createdData?.familyId).toBe('string');
    expect(createdData?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createdData?.expiresAt).toBeInstanceOf(Date);
    expect(createdData?.tokenHash).not.toBe(response.refreshToken);
  });

  it('rotates an active refresh token in the same family', async () => {
    findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      familyId: 'family-id',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const response = await service.refreshSession('a'.repeat(43));

    expect(response.refreshToken).toHaveLength(43);
    expect(capturedTransactionUpdateInput?.where).toEqual({
      id: 10,
      revokedAt: null,
    });
    expect(capturedTransactionUpdateInput?.data.revokedAt).toBeInstanceOf(Date);
    expect(capturedTransactionCreateInput?.data).toEqual(
      expect.objectContaining({
        userId: 1,
        familyId: 'family-id',
      }),
    );
  });

  it('revokes the family when a rotated token is reused', async () => {
    findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      familyId: 'family-id',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expectAuthError(
      service.refreshSession('a'.repeat(43)),
      'AUTH_REFRESH_TOKEN_REUSED',
    );
    expect(capturedUpdateInput?.where).toEqual({
      familyId: 'family-id',
      revokedAt: null,
    });
    expect(capturedUpdateInput?.data.revokedAt).toBeInstanceOf(Date);
  });

  it('rejects and revokes an expired refresh token', async () => {
    findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      familyId: 'family-id',
      expiresAt: new Date(Date.now() - 1),
      revokedAt: null,
    });

    await expectAuthError(
      service.refreshSession('a'.repeat(43)),
      'AUTH_REFRESH_TOKEN_EXPIRED',
    );
    expect(capturedUpdateInput?.where).toEqual({ id: 10, revokedAt: null });
    expect(capturedUpdateInput?.data.revokedAt).toBeInstanceOf(Date);
  });
});

async function expectAuthError(
  promise: Promise<unknown>,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an HttpException.');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getResponse()).toEqual(
      expect.objectContaining({ code: expectedCode }),
    );
  }
}
