import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { ActiveUser } from './modules/auth/decorators/session.decorator';
import { ProfileMemberRoles, Role, User } from '@prisma/client';

@Controller()
export class AppController {
  /**
   *
   * @param user
   * @param profileId
   * @returns User Info, used to check the @Auth user decorator as an example, pass an array of roles, first a core role either user or admin,
   * then pass the profile roles
   */

  @Get('view/:profileId')
  @Auth(
    [Role.USER],
    [
      ProfileMemberRoles.MANAGER,
      ProfileMemberRoles.ANALYST,
      ProfileMemberRoles.EDITOR,
    ],
  )
  async viewResource(
    @ActiveUser() user: User,
    @Param('profileId') profileId: number,
  ) {
    return {
      message: `You have access to view resources for profile ${profileId}.`,
      user,
    };
  }

  @Get('manage/:profileId')
  @Auth([Role.ADMIN]) // Requires `ADMIN` role
  async manageResource(@Param('profileId') profileId: number) {
    return {
      message: `You have access to manage resources for profile ${profileId}.`,
    };
  }
}
