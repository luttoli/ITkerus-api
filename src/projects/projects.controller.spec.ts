import {
  ITkerusRole,
  ProjectLinkType,
  ProjectPurpose,
  ProjectStatus,
} from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  const createProject = jest.fn();
  const service = { createProject } as unknown as ProjectsService;
  const controller = new ProjectsController(service);
  const request: CreateProjectDto = {
    title: '브랜드킷',
    summary: '브랜드 자료를 한곳에서 관리하는 웹 서비스',
    story: '',
    status: ProjectStatus.RELEASED,
    purposes: [ProjectPurpose.INTRODUCTION],
    requestedRoles: [ITkerusRole.MARKETER],
    links: [
      {
        type: ProjectLinkType.WEB,
        url: 'https://example.com',
      },
    ],
    imageUrls: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the authenticated user ID and body to the service', async () => {
    const response = { id: 'project-id' };
    createProject.mockResolvedValue(response);

    await expect(controller.createProject('user-id', request)).resolves.toEqual(
      response,
    );
    expect(createProject).toHaveBeenCalledWith('user-id', request);
  });
});
