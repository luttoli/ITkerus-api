import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { MyProfileResponseDto } from './dto/my-profile-response.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(@CurrentUserId() userId: number): Promise<MyProfileResponseDto> {
    return this.usersService.getMyProfile(userId);
  }

  @Patch('me/profile')
  updateMyProfile(
    @CurrentUserId() userId: number,
    @Body() request: UpdateMyProfileDto,
  ): Promise<MyProfileResponseDto> {
    return this.usersService.updateMyProfile(userId, request);
  }
}
