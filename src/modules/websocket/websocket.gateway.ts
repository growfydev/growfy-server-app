import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
	CustomEventPayload,
	CustomEventResponse,
	BroadcastEventPayload,
} from './types/socket';

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class SocketGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer() server: Server;
	private logger: Logger = new Logger('SocketGateway');

	afterInit() {
		this.logger.log('WebSocket initialized');
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	// Handle custom event
	@SubscribeMessage('customEvent')
	handleCustomEvent(client: Socket, payload: CustomEventPayload) {
		this.logger.log('Received custom event:', payload);

		const response: CustomEventResponse = {
			message: 'Event processed successfully',
			data: payload,
		};

		// Emit response to sender
		client.emit('customEventResponse', response);

		// Broadcast to all other clients
		const broadcastPayload: BroadcastEventPayload = payload;
		client.broadcast.emit('broadcastEvent', broadcastPayload);
	}

	// Emit to all clients
	emitToAll(event: string, data: object) {
		this.server.emit(event, data);
	}

	// Emit to a specific client
	emitToClient(clientId: string, event: string, data: object) {
		const client = this.server.sockets.sockets.get(clientId);
		if (client) {
			client.emit(event, data);
		}
	}
}
/*
################################################################

como implementar desde un servicio
import { Injectable } from '@nestjs/common';
import { SocketGateway } from './websocket.gateway';

@Injectable()
export class ExampleService {
  constructor(private socketGateway: SocketGateway) {}

  someMethod() {
    // Emitir un evento a todos los clientes conectados
    this.socketGateway.emitToAll('updateData', { key: 'value' });
  }
}
################################################################
*/
