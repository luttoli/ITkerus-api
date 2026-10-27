export type LoginResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: {
    id: number;
    isNewUser: boolean;
    isOnboardingCompleted: boolean;
  };
};
