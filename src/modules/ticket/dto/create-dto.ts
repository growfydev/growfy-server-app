import { TicketPriority, TicketType } from '@prisma/client';

export class CreateTicketDto {
	title: string;
	description: string;
	priority: TicketPriority;
	type: TicketType;
}
