export type RefreshTokenResponseDto = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
};
