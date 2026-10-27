import { ITkerusRole } from '@prisma/client';

export type MyProfileResponseDto = {
  id: number;
  nickname: string | null;
  introduction: string | null;
  primaryRole: ITkerusRole | null;
  secondaryRoles: ITkerusRole[];
  isOnboardingCompleted: boolean;
};
