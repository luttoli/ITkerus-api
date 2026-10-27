import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  const createNote = jest.fn();
  const service = { createNote } as unknown as NotesService;
  const controller = new NotesController(service);
  const request: CreateNoteDto = {
    content: '좋은 프로젝트예요.',
    didTryProject: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('protects the note endpoint with an access token', () => {
    expect(Reflect.hasMetadata(GUARDS_METADATA, NotesController)).toBe(true);
  });

  it('passes the authenticated user, project, and body to the service', async () => {
    const response = { id: 200 };
    createNote.mockResolvedValue(response);

    await expect(controller.createNote(1, 10, request)).resolves.toEqual(
      response,
    );
    expect(createNote).toHaveBeenCalledWith(1, 10, request);
  });
});
