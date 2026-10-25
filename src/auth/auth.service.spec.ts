import { HttpException } from '@nestjs/common';
import { Prisma, SocialProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { SocialIdentityTokenService } from './social/social-identity-token.service';

describe('AuthService', () => {
  const findUnique = jest.fn();
  let capturedCreateInput: Prisma.UserCreateArgs | undefined;
  let capturedUpdateInput: Prisma.UserUpdateArgs | undefined;
  const create = jest.fn<(input: Prisma.UserCreateArgs) => Promise<unknown>>();
  const update = jest.fn<(input: Prisma.UserUpdateArgs) => Promise<unknown>>();
  const prisma = {
    socialAccount: { findUnique },
    user: { create, update },
  } as unknown as PrismaService;
  const verifySocialIdentity = jest.fn();
  const socialIdentityTokenService = {
    verify: verifySocialIdentity,
  } as unknown as SocialIdentityTokenService;
  const issueAccessToken = jest.fn();
  const authTokenService = {
    issueAccessToken,
  } as unknown as AuthTokenService;
  const service = new AuthService(
    prisma,
    socialIdentityTokenService,
    authTokenService,
  );
  const request = {
    provider: SocialProvider.APPLE,
    identityToken: 'identity-token',
    nonce: 'apple-raw-nonce-value',
  };
  const acceptedAt = new Date('2026-10-26T00:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCreateInput = undefined;
    capturedUpdateInput = undefined;
    verifySocialIdentity.mockResolvedValue({
      provider: SocialProvider.APPLE,
      providerUserId: 'apple-user-id',
    });
    issueAccessToken.mockResolvedValue({
      accessToken: 'itkerus-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    });
  });

  it('returns the existing user for a known social account', async () => {
    findUnique.mockResolvedValue({
      user: {
        id: 'existing-user-id',
        isOnboardingCompleted: true,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
      },
    });

    await expect(service.login(request)).resolves.toEqual({
      accessToken: 'itkerus-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'existing-user-id',
        isNewUser: false,
        isOnboardingCompleted: true,
      },
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('requires consent before creating a user for a new identity', async () => {
    findUnique.mockResolvedValue(null);

    await expectHttpError(service.login(request), 428, 'AUTH_CONSENT_REQUIRED');
    expect(create).not.toHaveBeenCalled();
    expect(issueAccessToken).not.toHaveBeenCalled();
  });

  it('creates a user after both required documents are accepted', async () => {
    findUnique.mockResolvedValue(null);
    create.mockImplementation((input: Prisma.UserCreateArgs) => {
      capturedCreateInput = input;
      return Promise.resolve({
        id: 'new-user-id',
        isOnboardingCompleted: false,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
      });
    });

    await expect(
      service.login({
        ...request,
        acceptedTerms: true,
        acceptedPrivacy: true,
      }),
    ).resolves.toEqual({
      accessToken: 'itkerus-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'new-user-id',
        isNewUser: true,
        isOnboardingCompleted: false,
      },
    });
    expect(capturedCreateInput?.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(capturedCreateInput?.data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(capturedCreateInput?.data.socialAccounts).toEqual({
      create: {
        provider: SocialProvider.APPLE,
        providerUserId: 'apple-user-id',
      },
    });
  });

  it('requires consent from an existing user without a consent record', async () => {
    findUnique.mockResolvedValue({
      user: {
        id: 'existing-user-id',
        isOnboardingCompleted: true,
        termsAcceptedAt: null,
        privacyAcceptedAt: null,
      },
    });

    await expectHttpError(service.login(request), 428, 'AUTH_CONSENT_REQUIRED');
    expect(update).not.toHaveBeenCalled();
  });

  it('stores missing consent timestamps for an existing user', async () => {
    findUnique.mockResolvedValue({
      user: {
        id: 'existing-user-id',
        isOnboardingCompleted: true,
        termsAcceptedAt: null,
        privacyAcceptedAt: null,
      },
    });
    update.mockImplementation((input: Prisma.UserUpdateArgs) => {
      capturedUpdateInput = input;
      return Promise.resolve({
        id: 'existing-user-id',
        isOnboardingCompleted: true,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
      });
    });

    await expect(
      service.login({
        ...request,
        acceptedTerms: true,
        acceptedPrivacy: true,
      }),
    ).resolves.toEqual({
      accessToken: 'itkerus-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'existing-user-id',
        isNewUser: false,
        isOnboardingCompleted: true,
      },
    });
    expect(capturedUpdateInput?.where).toEqual({ id: 'existing-user-id' });
    expect(capturedUpdateInput?.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(capturedUpdateInput?.data.privacyAcceptedAt).toBeInstanceOf(Date);
  });
});

async function expectHttpError(
  promise: Promise<unknown>,
  expectedStatus: number,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an HttpException.');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(expectedStatus);
    expect((error as HttpException).getResponse()).toEqual(
      expect.objectContaining({ code: expectedCode }),
    );
  }
}
