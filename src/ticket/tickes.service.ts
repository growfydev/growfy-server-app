import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { Ticket } from '@prisma/client';

@Injectable()
export class TicketsService {
	constructor(private readonly prisma: PrismaService) {}

	async createTicket(
		title: string,
		description: string,
		profileId: number,
	): Promise<Ticket> {
		// Buscar un agente virtual disponible
		const virtualAssistant = await this.prisma.user.findFirst({
			where: { role: 'VIRTUAL_ASSISTANT' },
		});

		// Crear el ticket y asignarlo al agente virtual
		return this.prisma.ticket.create({
			data: {
				title,
				description,
				profileId,
				assignedToId: virtualAssistant?.id,
			},
		});
	}

	async getTicketsByProfile(profileId: number): Promise<Ticket[]> {
		return this.prisma.ticket.findMany({
			where: { profileId },
		});
	}

	async getTicketById(id: number): Promise<Ticket> {
		return this.prisma.ticket.findUnique({
			where: { id },
		});
	}

	async updateTicketStatus(
		id: number,
		profileId: number,
		status: string,
	): Promise<Ticket> {
		// Verificar que el ticket pertenezca al perfil
		const ticket = await this.prisma.ticket.findFirst({
			where: { id, profileId },
		});

		if (!ticket) {
			throw new Error('Ticket not found');
		}

		return this.prisma.ticket.update({
			where: { id },
			data: { status },
		});
	}
}
