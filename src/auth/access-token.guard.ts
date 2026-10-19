import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthErrorCode, createUnauthorizedException } from './auth-error';
import { AuthTokenService } from './auth-token.service';
import { AuthenticatedRequest } from './authenticated-request';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    const userId = await this.authTokenService.verifyAccessToken(token);

    request.auth = { userId };
    return true;
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw createUnauthorizedException(
        AuthErrorCode.tokenMissing,
        '로그인이 필요합니다.',
      );
    }

    const parts = authorization.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw createUnauthorizedException(
        AuthErrorCode.tokenInvalid,
        '인증 정보가 올바르지 않습니다.',
      );
    }

    return parts[1];
  }
}
