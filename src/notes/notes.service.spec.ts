import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ITkerusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  const findUser = jest.fn();
  const findProject = jest.fn();
  const findNote = jest.fn();
  let capturedCreateInput: Prisma.ITkerusNoteCreateArgs | undefined;
  let capturedUpdateInput: Prisma.ITkerusNoteUpdateArgs | undefined;
  const createNote =
    jest.fn<(input: Prisma.ITkerusNoteCreateArgs) => Promise<unknown>>();
  const updateNote =
    jest.fn<(input: Prisma.ITkerusNoteUpdateArgs) => Promise<unknown>>();
  const prisma = {
    user: { findUnique: findUser },
    projectPost: { findFirst: findProject },
    iTkerusNote: {
      findUnique: findNote,
      create: createNote,
      update: updateNote,
    },
  } as unknown as PrismaService;
  const service = new NotesService(prisma);
  const request: CreateNoteDto = {
    content: '첫 화면에서 다음 행동이 잘 보여요.',
    didTryProject: true,
  };
  const storedNote = {
    id: 'note-id',
    projectId: 'project-id',
    authorId: 'user-id',
    authorRole: ITkerusRole.DESIGNER,
    content: request.content,
    didTryProject: request.didTryProject,
    isMarkedHelpful: false,
    createdAt: new Date('2026-10-25T00:00:00.000Z'),
    updatedAt: new Date('2026-10-25T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findUser.mockResolvedValue({
      primaryRole: ITkerusRole.DESIGNER,
      isOnboardingCompleted: true,
    });
    findProject.mockResolvedValue({ authorId: 'project-author-id' });
    findNote.mockResolvedValue(null);
    createNote.mockImplementation((input: Prisma.ITkerusNoteCreateArgs) => {
      capturedCreateInput = input;
      return Promise.resolve(storedNote);
    });
    updateNote.mockImplementation((input: Prisma.ITkerusNoteUpdateArgs) => {
      capturedUpdateInput = input;
      return Promise.resolve(storedNote);
    });
  });

  it('creates a note with the current profile role snapshot', async () => {
    await expect(
      service.createNote('user-id', 'project-id', request),
    ).resolves.toEqual(storedNote);
    expect(capturedCreateInput?.data).toEqual({
      projectId: 'project-id',
      authorId: 'user-id',
      authorRole: ITkerusRole.DESIGNER,
      content: request.content,
      didTryProject: true,
    });
  });

  it('returns 401 when the token user no longer exists', async () => {
    findUser.mockResolvedValue(null);

    await expectHttpError(
      service.createNote('deleted-user-id', 'project-id', request),
      UnauthorizedException,
      'AUTH_USER_NOT_FOUND',
    );
  });

  it('requires onboarding and a primary role', async () => {
    findUser.mockResolvedValue({
      primaryRole: null,
      isOnboardingCompleted: false,
    });

    await expectHttpError(
      service.createNote('user-id', 'project-id', request),
      ForbiddenException,
      'NOTE_PROFILE_REQUIRED',
    );
  });

  it('returns 404 for a missing or deleted project', async () => {
    findProject.mockResolvedValue(null);

    await expectHttpError(
      service.createNote('user-id', 'project-id', request),
      NotFoundException,
      'PROJECT_NOT_FOUND',
    );
  });

  it("rejects a note on the author's own project", async () => {
    findProject.mockResolvedValue({ authorId: 'user-id' });

    await expectHttpError(
      service.createNote('user-id', 'project-id', request),
      ForbiddenException,
      'NOTE_OWN_PROJECT_FORBIDDEN',
    );
  });

  it('returns 409 when the user already wrote a note', async () => {
    findNote.mockResolvedValue({ id: 'note-id', deletedAt: null });

    await expectHttpError(
      service.createNote('user-id', 'project-id', request),
      ConflictException,
      'NOTE_ALREADY_EXISTS',
    );
    expect(createNote).not.toHaveBeenCalled();
  });

  it('restores the same row when the previous note was deleted', async () => {
    findNote.mockResolvedValue({
      id: 'note-id',
      deletedAt: new Date('2026-10-24T00:00:00.000Z'),
    });

    await expect(
      service.createNote('user-id', 'project-id', request),
    ).resolves.toEqual(storedNote);
    expect(capturedUpdateInput?.where).toEqual({ id: 'note-id' });
    expect(capturedUpdateInput?.data).toEqual({
      authorRole: ITkerusRole.DESIGNER,
      content: request.content,
      didTryProject: true,
      isMarkedHelpful: false,
      deletedAt: null,
    });
    expect(createNote).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique constraint conflict to 409', async () => {
    createNote.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expectHttpError(
      service.createNote('user-id', 'project-id', request),
      ConflictException,
      'NOTE_ALREADY_EXISTS',
    );
  });
});

async function expectHttpError(
  promise: Promise<unknown>,
  exceptionType:
    | typeof ConflictException
    | typeof ForbiddenException
    | typeof NotFoundException
    | typeof UnauthorizedException,
  expectedCode: string,
) {
  try {
    await promise;
    throw new Error('Expected an HTTP exception.');
  } catch (error) {
    expect(error).toBeInstanceOf(exceptionType);
    expect(
      (
        error as
          | ConflictException
          | ForbiddenException
          | NotFoundException
          | UnauthorizedException
      ).getResponse(),
    ).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}
