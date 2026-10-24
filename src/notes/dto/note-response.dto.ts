import { ITkerusRole } from '@prisma/client';

export type NoteResponseDto = {
  id: string;
  projectId: string;
  authorId: string;
  authorRole: ITkerusRole;
  content: string;
  didTryProject: boolean;
  isMarkedHelpful: boolean;
  createdAt: Date;
  updatedAt: Date;
};
