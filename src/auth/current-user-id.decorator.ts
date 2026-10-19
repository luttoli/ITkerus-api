import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthErrorCode, createUnauthorizedException } from './auth-error';
import { AuthenticatedRequest } from './authenticated-request';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.userId;

    if (!userId) {
      throw createUnauthorizedException(
        AuthErrorCode.tokenMissing,
        '로그인이 필요합니다.',
      );
    }

    return userId;
  },
);
