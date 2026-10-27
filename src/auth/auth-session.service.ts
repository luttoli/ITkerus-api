import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthErrorCode, createUnauthorizedException } from './auth-error';
import { AuthTokenService } from './auth-token.service';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { JwtConfigService } from './jwt-config.service';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokenService: AuthTokenService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  async issueSession(userId: number): Promise<RefreshTokenResponseDto> {
    const refreshToken = createRefreshToken();
    await this.prisma.refreshSession.create({
      data: {
        userId,
        familyId: randomUUID(),
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: this.refreshExpirationDate(),
      },
    });

    return this.createTokenResponse(userId, refreshToken);
  }

  async refreshSession(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      throw createUnauthorizedException(
        AuthErrorCode.refreshTokenInvalid,
        '로그인 갱신 정보가 올바르지 않습니다.',
      );
    }

    if (session.revokedAt) {
      await this.revokeFamily(session.familyId);
      throw createUnauthorizedException(
        AuthErrorCode.refreshTokenReused,
        '이미 사용된 로그인 갱신 정보입니다. 다시 로그인해주세요.',
      );
    }

    if (session.expiresAt <= new Date()) {
      await this.prisma.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw createUnauthorizedException(
        AuthErrorCode.refreshTokenExpired,
        '로그인 유지 기간이 만료되었습니다. 다시 로그인해주세요.',
      );
    }

    const nextRefreshToken = createRefreshToken();
    const rotated = await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revoked.count !== 1) {
        return false;
      }

      await transaction.refreshSession.create({
        data: {
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: this.refreshExpirationDate(),
        },
      });
      return true;
    });

    if (!rotated) {
      await this.revokeFamily(session.familyId);
      throw createUnauthorizedException(
        AuthErrorCode.refreshTokenReused,
        '이미 사용된 로그인 갱신 정보입니다. 다시 로그인해주세요.',
      );
    }

    return this.createTokenResponse(session.userId, nextRefreshToken);
  }

  async revokeSession(refreshToken: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async createTokenResponse(
    userId: number,
    refreshToken: string,
  ): Promise<RefreshTokenResponseDto> {
    const access = await this.authTokenService.issueAccessToken(userId);
    return {
      ...access,
      refreshToken,
      refreshExpiresInSeconds: this.jwtConfig.refresh.expiresInSeconds,
    };
  }

  private refreshExpirationDate(): Date {
    return new Date(
      Date.now() + this.jwtConfig.refresh.expiresInSeconds * 1_000,
    );
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

function createRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}
