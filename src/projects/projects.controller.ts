import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import {
  ProjectDetailResponseDto,
  ProjectResponseDto,
} from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjects(
    @Query() query: GetProjectsQueryDto,
  ): Promise<ProjectListResponseDto> {
    return this.projectsService.getProjects(query);
  }

  @Get(':projectId')
  getProject(
    @Param('projectId') projectId: string,
  ): Promise<ProjectDetailResponseDto> {
    return this.projectsService.getProject(projectId);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  createProject(
    @CurrentUserId() userId: string,
    @Body() request: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(userId, request);
  }

  @Patch(':projectId')
  @UseGuards(AccessTokenGuard)
  updateProject(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
    @Body() request: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateProject(userId, projectId, request);
  }

  @Delete(':projectId')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  deleteProject(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    return this.projectsService.deleteProject(userId, projectId);
  }
}
