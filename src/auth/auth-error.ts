import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const AuthErrorCode = {
  tokenMissing: 'AUTH_TOKEN_MISSING',
  tokenInvalid: 'AUTH_TOKEN_INVALID',
  tokenExpired: 'AUTH_TOKEN_EXPIRED',
  providerTokenInvalid: 'AUTH_PROVIDER_TOKEN_INVALID',
  providerNotConfigured: 'AUTH_PROVIDER_NOT_CONFIGURED',
  providerUnavailable: 'AUTH_PROVIDER_UNAVAILABLE',
} as const;

export type AuthErrorCodeValue =
  (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export function createUnauthorizedException(
  code: AuthErrorCodeValue,
  message: string,
) {
  return new UnauthorizedException({ code, message });
}

export function createAuthServiceUnavailableException(
  code: AuthErrorCodeValue,
  message: string,
) {
  return new ServiceUnavailableException({ code, message });
}
