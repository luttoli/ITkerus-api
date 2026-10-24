import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { ProjectAuthorResponseDto } from './project-response.dto';

export type ProjectListItemResponseDto = {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  purposes: ProjectPurpose[];
  itkerusFocus: string | null;
  requestedRoles: ITkerusRole[];
  iconUrl: string | null;
  selectedImageUrl: string | null;
  linkTypes: ProjectLinkType[];
  itkerusNoteCount: number;
  helpedCount: number;
  createdAt: Date;
  author: ProjectAuthorResponseDto;
};

export type ProjectListResponseDto = {
  projects: ProjectListItemResponseDto[];
  nextCursor: string | null;
};
