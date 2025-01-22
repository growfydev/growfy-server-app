import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TicketsService } from './tickes.service';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';
import { Role } from '@prisma/client';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { CreateTicketDto } from './dto/create-dto';

@Controller('tickets')
export class TicketsController {
	constructor(private readonly ticketsService: TicketsService) {}

	@Post()
	@ResponseMessage('Ticket creado exitosamente')
	@Auth([Role.USER])
	async createTicket(
		@Body() createTicketDto: CreateTicketDto,
		@Param('profileId') profileId: number,
	) {
		return this.ticketsService.createTicket(
			createTicketDto.title,
			createTicketDto.description,
			+profileId,
		);
	}

	@Get('profile/:profileId')
	@Auth([Role.USER])
	async getTicketsByProfile(@Param('profileId') profileId: number) {
		return this.ticketsService.getTicketsByProfile(+profileId);
	}

	@Get(':id')
	@Auth([Role.USER])
	async getTicketById(@Param('id') id: number) {
		return this.ticketsService.getTicketById(id);
	}

	@Patch(':profileId/:id/status')
	@ResponseMessage('Estado del ticket actualizado exitosamente')
	@Auth([Role.USER])
	async updateTicketStatus(
		@Param('id') id: number,
		@Param('profileId') profileId: number,
		@Body('status') status: string,
	) {
		return this.ticketsService.updateTicketStatus(+id, +profileId, status);
	}
}
