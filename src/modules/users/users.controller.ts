import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Post('create')
  async createUser(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
}
