export type LoginResponseDto = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
  user: {
    id: number;
    isNewUser: boolean;
    isOnboardingCompleted: boolean;
  };
};
