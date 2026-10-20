import { SocialProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { SocialIdentityTokenService } from './social/social-identity-token.service';

describe('AuthService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const prisma = {
    socialAccount: { findUnique },
    user: { create },
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

  beforeEach(() => {
    jest.clearAllMocks();
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
      user: { id: 'existing-user-id', isOnboardingCompleted: true },
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
  });

  it('creates a user and social account for a verified new identity', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: 'new-user-id',
      isOnboardingCompleted: false,
    });

    await expect(service.login(request)).resolves.toEqual({
      accessToken: 'itkerus-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'new-user-id',
        isNewUser: true,
        isOnboardingCompleted: false,
      },
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          socialAccounts: {
            create: {
              provider: SocialProvider.APPLE,
              providerUserId: 'apple-user-id',
            },
          },
        },
      }),
    );
  });
});
