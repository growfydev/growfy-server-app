import { Auth } from '../auth/decorators/auth.decorator';
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CoreRole, PermissionFlags } from '@prisma/client';
import { CreateProfileDto } from './dto/create-profile.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ProfilesService } from './profiles.service';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Post()
  @ResponseMessage('Profile created successfully')
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  @ResponseMessage('Profiles fetched successfully')
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Profile fetched successfully')
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(+id);
  }

  @Put(':id')
  @ResponseMessage('Profile updated successfully')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(+id, updateProfileDto);
  }

  @Delete(':id')
  @ResponseMessage('Profile deleted successfully')
  remove(@Param('id') id: string) {
    return this.profilesService.remove(+id);
  }

  @Put('deactivate/:id')
  @ResponseMessage('Profile deactivated successfully')
  deactivate(@Param('id') id: string) {
    return this.profilesService.deactivate(+id);
  }

  @Put('activate/:id')
  @ResponseMessage('Profile activated successfully')
  activate(@Param('id') id: string) {
    return this.profilesService.activate(+id);
  }


  @Post('invite')
  @Auth([CoreRole.USER], [PermissionFlags.MANAGEMENT])
  @ResponseMessage('User invited successfully')
  async inviteUser(@Body() inviteUserDto: InviteUserDto) {
    return this.profilesService.inviteUser(inviteUserDto);
  }
}