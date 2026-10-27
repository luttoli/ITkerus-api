import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthErrorCode, createUnauthorizedException } from '../auth/auth-error';
import { PrismaService } from '../prisma/prisma.service';
import { createProjectNotFoundException } from '../projects/projects-error';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import {
  createNoteAlreadyExistsException,
  createNoteProfileRequiredException,
  createOwnProjectNoteForbiddenException,
} from './notes-error';

const noteSelect = {
  id: true,
  projectId: true,
  authorId: true,
  authorRole: true,
  content: true,
  didTryProject: true,
  isMarkedHelpful: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ITkerusNoteSelect;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async createNote(
    userId: number,
    projectId: number,
    request: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        primaryRole: true,
        isOnboardingCompleted: true,
      },
    });

    if (!author) {
      throw createUnauthorizedException(
        AuthErrorCode.userNotFound,
        '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
      );
    }

    if (!author.isOnboardingCompleted || !author.primaryRole) {
      throw createNoteProfileRequiredException();
    }

    const project = await this.prisma.projectPost.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: { authorId: true },
    });

    if (!project) {
      throw createProjectNotFoundException();
    }

    if (project.authorId === userId) {
      throw createOwnProjectNoteForbiddenException();
    }

    const existingNote = await this.prisma.iTkerusNote.findUnique({
      where: {
        projectId_authorId: {
          projectId,
          authorId: userId,
        },
      },
      select: { id: true, deletedAt: true },
    });

    if (existingNote && !existingNote.deletedAt) {
      throw createNoteAlreadyExistsException();
    }

    if (existingNote) {
      return this.prisma.iTkerusNote.update({
        where: { id: existingNote.id },
        data: {
          authorRole: author.primaryRole,
          content: request.content,
          didTryProject: request.didTryProject,
          isMarkedHelpful: false,
          deletedAt: null,
        },
        select: noteSelect,
      });
    }

    try {
      return await this.prisma.iTkerusNote.create({
        data: {
          projectId,
          authorId: userId,
          authorRole: author.primaryRole,
          content: request.content,
          didTryProject: request.didTryProject,
        },
        select: noteSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw createNoteAlreadyExistsException();
      }

      throw error;
    }
  }
}
