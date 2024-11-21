import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) { }

  @Post()
  @ResponseMessage('Member created successfully')
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @ResponseMessage('Members fetched successfully')
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Member fetched successfully')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(+id);
  }

  @Put(':id')
  @ResponseMessage('Member updated successfully')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(+id, updateMemberDto);
  }

  @Delete(':id')
  @ResponseMessage('Member deleted successfully')
  remove(@Param('id') id: string) {
    return this.membersService.remove(+id);
  }

  @Put('deactivate/:id')
  @ResponseMessage('Member deactivated successfully')
  deactivate(@Param('id') id: string) {
    return this.membersService.deactivate(+id);
  }

  @Put('activate/:id')
  @ResponseMessage('Member activated successfully')
  activate(@Param('id') id: string) {
    return this.membersService.activate(+id);
  }
}
