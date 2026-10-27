import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { NotesService } from './notes.service';

@Controller('projects/:projectId/notes')
@UseGuards(AccessTokenGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  createNote(
    @CurrentUserId() userId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() request: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.createNote(userId, projectId, request);
  }
}
