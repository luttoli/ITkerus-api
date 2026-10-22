import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';

export type ProjectLinkResponseDto = {
  id: string;
  type: ProjectLinkType;
  url: string;
};

export type ProjectResponseDto = {
  id: string;
  authorId: string;
  title: string;
  summary: string;
  story: string;
  status: ProjectStatus;
  purposes: ProjectPurpose[];
  itkerusFocus: string | null;
  requestedRoles: ITkerusRole[];
  iconUrl: string | null;
  links: ProjectLinkResponseDto[];
  imageUrls: string[];
  selectedImageUrl: string | null;
  viewCount: number;
  itkerusNoteCount: number;
  helpedCount: number;
  createdAt: Date;
  updatedAt: Date;
};
