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

	// Almacena las conexiones de los clientes
	private clients: Map<string, Socket> = new Map();

	// Almacena las conexiones agrupadas por identificador de usuario (ej. 'eduardo-30')
	private userConnections: Map<string, Set<string>> = new Map();

	afterInit() {
		this.logger.log('WebSocket initialized');
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);

		// Suponiendo que el cliente envíe su identificador de usuario al conectarse
		const userId = client.handshake.query.userId as string; // O cualquier otro parámetro de autenticación

		if (userId) {
			// Almacena la conexión del cliente en el mapa de conexiones de usuarios
			let connections = this.userConnections.get(userId);
			if (!connections) {
				connections = new Set<string>();
				this.userConnections.set(userId, connections);
			}
			connections.add(client.id);

			// Almacena el cliente en el mapa de clientes conectados
			this.clients.set(client.id, client);
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);

		// Eliminar al cliente de la lista de conexiones
		const userId = client.handshake.query.userId as string;
		if (userId) {
			const connections = this.userConnections.get(userId);
			if (connections) {
				connections.delete(client.id);
				if (connections.size === 0) {
					this.userConnections.delete(userId);
				}
			}
		}

		// Eliminar al cliente del mapa de clientes conectados
		this.clients.delete(client.id);
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

		// Broadcast to all other clients (except the sender)
		const broadcastPayload: BroadcastEventPayload = payload;
		client.broadcast.emit('broadcastEvent', broadcastPayload);
	}

	// Emit to all clients
	emitToAll(event: string, data: object) {
		this.server.emit(event, data);
	}

	// Emit to a specific client
	emitToClient(clientId: string, event: string, data: object) {
		const client = this.clients.get(clientId);
		if (client) {
			client.emit(event, data);
		}
	}

	// Emit to all clients with a specific userId (e.g., 'eduardo-30')
	emitToUser(userId: string, event: string, data: object) {
		const connections = this.userConnections.get(userId);
		if (connections) {
			connections.forEach((clientId) => {
				const client = this.clients.get(clientId);
				if (client) {
					client.emit(event, data);
				}
			});
		}
	}
}
