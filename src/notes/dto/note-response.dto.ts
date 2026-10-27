import { ITkerusRole } from '@prisma/client';

export type NoteResponseDto = {
  id: number;
  projectId: number;
  authorId: number;
  authorRole: ITkerusRole;
  content: string;
  didTryProject: boolean;
  isMarkedHelpful: boolean;
  createdAt: Date;
  updatedAt: Date;
};
