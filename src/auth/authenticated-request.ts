import { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
};

export type AuthenticatedRequest = Request & {
  auth?: AuthenticatedUser;
};
