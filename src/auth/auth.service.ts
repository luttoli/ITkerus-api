import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createConsentRequiredException } from './auth-error';
import { AuthTokenService } from './auth-token.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { VerifiedSocialIdentity } from './social/social-identity-token.service';
import { SocialIdentityTokenService } from './social/social-identity-token.service';

type LoginUser = {
  id: number;
  isOnboardingCompleted: boolean;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socialIdentityTokenService: SocialIdentityTokenService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    const identity = await this.socialIdentityTokenService.verify(
      request.provider,
      request.identityToken,
      request.nonce,
    );
    const { user, isNewUser } = await this.findOrCreateUser(identity, request);
    const issuedToken = await this.authTokenService.issueAccessToken(user.id);

    return {
      ...issuedToken,
      user: {
        id: user.id,
        isNewUser,
        isOnboardingCompleted: user.isOnboardingCompleted,
      },
    };
  }

  private async findOrCreateUser(
    identity: VerifiedSocialIdentity,
    request: LoginRequestDto,
  ): Promise<{
    user: LoginUser;
    isNewUser: boolean;
  }> {
    const existingUser = await this.findUser(identity);
    if (existingUser) {
      const user = await this.acceptConsent(existingUser, request);
      return { user, isNewUser: false };
    }

    if (!hasRequiredConsent(request)) {
      throw createConsentRequiredException();
    }

    try {
      const acceptedAt = new Date();
      const user = await this.prisma.user.create({
        data: {
          termsAcceptedAt: acceptedAt,
          privacyAcceptedAt: acceptedAt,
          socialAccounts: {
            create: {
              provider: identity.provider,
              providerUserId: identity.providerUserId,
            },
          },
        },
        select: {
          id: true,
          isOnboardingCompleted: true,
          termsAcceptedAt: true,
          privacyAcceptedAt: true,
        },
      });

      return { user, isNewUser: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const user = await this.findUser(identity);
        if (user) {
          const acceptedUser = await this.acceptConsent(user, request);
          return { user: acceptedUser, isNewUser: false };
        }
      }

      throw error;
    }
  }

  private async acceptConsent(
    user: LoginUser,
    request: LoginRequestDto,
  ): Promise<LoginUser> {
    if (user.termsAcceptedAt && user.privacyAcceptedAt) {
      return user;
    }

    if (!hasRequiredConsent(request)) {
      throw createConsentRequiredException();
    }

    const acceptedAt = new Date();
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        termsAcceptedAt: user.termsAcceptedAt ?? acceptedAt,
        privacyAcceptedAt: user.privacyAcceptedAt ?? acceptedAt,
      },
      select: {
        id: true,
        isOnboardingCompleted: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
      },
    });
  }

  private async findUser(
    identity: VerifiedSocialIdentity,
  ): Promise<LoginUser | null> {
    const account = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: identity.provider,
          providerUserId: identity.providerUserId,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            isOnboardingCompleted: true,
            termsAcceptedAt: true,
            privacyAcceptedAt: true,
          },
        },
      },
    });

    return account?.user ?? null;
  }
}

function hasRequiredConsent(request: LoginRequestDto): boolean {
  return request.acceptedTerms === true && request.acceptedPrivacy === true;
}
