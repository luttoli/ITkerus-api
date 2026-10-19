import { UnauthorizedException } from '@nestjs/common';

export const AuthErrorCode = {
  tokenMissing: 'AUTH_TOKEN_MISSING',
  tokenInvalid: 'AUTH_TOKEN_INVALID',
  tokenExpired: 'AUTH_TOKEN_EXPIRED',
} as const;

export function createUnauthorizedException(
  code: (typeof AuthErrorCode)[keyof typeof AuthErrorCode],
  message: string,
) {
  return new UnauthorizedException({ code, message });
}
