import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const AuthErrorCode = {
  tokenMissing: 'AUTH_TOKEN_MISSING',
  tokenInvalid: 'AUTH_TOKEN_INVALID',
  tokenExpired: 'AUTH_TOKEN_EXPIRED',
  refreshTokenInvalid: 'AUTH_REFRESH_TOKEN_INVALID',
  refreshTokenExpired: 'AUTH_REFRESH_TOKEN_EXPIRED',
  refreshTokenReused: 'AUTH_REFRESH_TOKEN_REUSED',
  providerTokenInvalid: 'AUTH_PROVIDER_TOKEN_INVALID',
  providerNotConfigured: 'AUTH_PROVIDER_NOT_CONFIGURED',
  providerUnavailable: 'AUTH_PROVIDER_UNAVAILABLE',
  userNotFound: 'AUTH_USER_NOT_FOUND',
  consentRequired: 'AUTH_CONSENT_REQUIRED',
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

export function createConsentRequiredException() {
  return new HttpException(
    {
      code: AuthErrorCode.consentRequired,
      message: '이용약관과 개인정보 처리방침 동의가 필요합니다.',
    },
    HttpStatus.PRECONDITION_REQUIRED,
  );
}
