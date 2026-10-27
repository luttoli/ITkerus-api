import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';

export type ProjectLinkResponseDto = {
  id: number;
  type: ProjectLinkType;
  url: string;
};

export type ProjectAuthorResponseDto = {
  id: number;
  nickname: string;
  primaryRole: ITkerusRole;
  secondaryRoles: ITkerusRole[];
};

export type ProjectResponseDto = {
  id: number;
  authorId: number;
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

export type ProjectDetailResponseDto = ProjectResponseDto & {
  author: ProjectAuthorResponseDto;
};
