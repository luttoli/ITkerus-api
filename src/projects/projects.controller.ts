import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(AccessTokenGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(
    @CurrentUserId() userId: string,
    @Body() request: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(userId, request);
  }

  @Patch(':projectId')
  updateProject(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
    @Body() request: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateProject(userId, projectId, request);
  }

  @Delete(':projectId')
  @HttpCode(204)
  deleteProject(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    return this.projectsService.deleteProject(userId, projectId);
  }
}
