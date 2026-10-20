export type LoginResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: {
    id: string;
    isNewUser: boolean;
    isOnboardingCompleted: boolean;
  };
};
