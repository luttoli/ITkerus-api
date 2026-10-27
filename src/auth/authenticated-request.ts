import { Request } from 'express';

export type AuthenticatedUser = {
  userId: number;
};

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedUser;
};
