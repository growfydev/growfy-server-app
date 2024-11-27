import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@prisma/client';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get(':name/provider')
  @Auth([Role.USER])
  async getProviderByname(@Param('name') id: number) {
    return await this.providerService.getProviderById(id);
  }
}
