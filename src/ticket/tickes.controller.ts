import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TicketsService } from './tickes.service';

@Controller('tickets')
export class TicketsController {
	constructor(private readonly ticketsService: TicketsService) {}

	@Post()
	async createTicket(
		@Body('title') title: string,
		@Body('description') description: string,
		@Body('profileId') profileId: number,
	) {
		return this.ticketsService.createTicket(title, description, profileId);
	}

	@Get('profile/:profileId')
	async getTicketsByProfile(@Param('profileId') profileId: number) {
		return this.ticketsService.getTicketsByProfile(profileId);
	}

	@Get(':id')
	async getTicketById(@Param('id') id: number) {
		return this.ticketsService.getTicketById(id);
	}

	@Patch(':id/status')
	async updateTicketStatus(
		@Param('id') id: number,
		@Body('status') status: string,
	) {
		return this.ticketsService.updateTicketStatus(id, status);
	}
}
