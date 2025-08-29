import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../../config';
import { logger } from '../../server';
import { jwtService } from './auth/jwt.service';
import { apiKeyService } from './auth/apiKey.service';

export interface BridgeSocketData {
  companyId?: number;
  userId?: number;
  authType?: 'jwt' | 'apiKey';
  subscriptions?: string[];
}

export interface EventSubscription {
  events: string[];
  filters?: Record<string, any>;
}

export class WebSocketService {
  private io: SocketIOServer;
  private bridgeNamespace: Namespace;
  private connections: Map<string, Socket> = new Map();
  private companyRooms: Map<number, Set<string>> = new Map();
  private eventSubscriptions: Map<string, EventSubscription> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: config.cors,
      path: '/api/bridge/socket.io/',
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Create Bridge namespace
    this.bridgeNamespace = this.io.of('/api/bridge/v1/events');
    this.setupNamespace();
  }

  private setupNamespace(): void {
    // Authentication middleware
    this.bridgeNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const apiKey = socket.handshake.headers['x-api-key'] as string;

        if (token) {
          // JWT authentication
          try {
            const decoded = jwtService.verifyToken(token);
            socket.data = {
              companyId: decoded.companyId,
              userId: decoded.userId,
              authType: 'jwt',
              subscriptions: [],
            } as BridgeSocketData;
            logger.info('WebSocket JWT auth successful', {
              socketId: socket.id,
              userId: decoded.userId,
              companyId: decoded.companyId,
            });
            next();
          } catch (error: any) {
            next(new Error('Invalid JWT token'));
          }
        } else if (apiKey) {
          // API Key authentication
          const apiKeyData = await apiKeyService.validateApiKey(apiKey);
          if (apiKeyData) {
            socket.data = {
              companyId: apiKeyData.companyId,
              authType: 'apiKey',
              subscriptions: [],
            } as BridgeSocketData;
            logger.info('WebSocket API Key auth successful', {
              socketId: socket.id,
              companyId: apiKeyData.companyId,
            });
            next();
          } else {
            next(new Error('Invalid API key'));
          }
        } else {
          next(new Error('Authentication required'));
        }
      } catch (error: any) {
        logger.error('WebSocket auth error', { error: error.message });
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.bridgeNamespace.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    const socketData = socket.data as BridgeSocketData;
    
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      companyId: socketData.companyId,
      authType: socketData.authType,
    });

    // Store connection
    this.connections.set(socket.id, socket);

    // Join company room
    if (socketData.companyId) {
      const roomName = `company:${socketData.companyId}`;
      socket.join(roomName);
      this.addToCompanyRoom(socketData.companyId, socket.id);
    }

    // Event handlers
    socket.on('subscribe', (data: EventSubscription) => {
      this.handleSubscribe(socket, data);
    });

    socket.on('unsubscribe', (events: string[]) => {
      this.handleUnsubscribe(socket, events);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        error: error.message,
      });
    });

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      companyId: socketData.companyId,
      timestamp: new Date().toISOString(),
    });
  }

  private handleSubscribe(socket: Socket, subscription: EventSubscription): void {
    const socketData = socket.data as BridgeSocketData;
    
    if (!subscription.events || !Array.isArray(subscription.events)) {
      socket.emit('error', { message: 'Invalid subscription format' });
      return;
    }

    // Store subscription
    this.eventSubscriptions.set(socket.id, subscription);
    socketData.subscriptions = subscription.events;

    // Join event-specific rooms
    subscription.events.forEach(event => {
      socket.join(`event:${event}`);
    });

    logger.info('Client subscribed to events', {
      socketId: socket.id,
      events: subscription.events,
      filters: subscription.filters,
    });

    socket.emit('subscribed', {
      events: subscription.events,
      timestamp: new Date().toISOString(),
    });
  }

  private handleUnsubscribe(socket: Socket, events: string[]): void {
    const socketData = socket.data as BridgeSocketData;
    
    if (!events || !Array.isArray(events)) {
      socket.emit('error', { message: 'Invalid unsubscribe format' });
      return;
    }

    // Leave event-specific rooms
    events.forEach(event => {
      socket.leave(`event:${event}`);
    });

    // Update subscriptions
    const currentSubscription = this.eventSubscriptions.get(socket.id);
    if (currentSubscription) {
      currentSubscription.events = currentSubscription.events.filter(
        e => !events.includes(e)
      );
      
      if (currentSubscription.events.length === 0) {
        this.eventSubscriptions.delete(socket.id);
      }
    }

    socketData.subscriptions = socketData.subscriptions?.filter(
      e => !events.includes(e)
    ) || [];

    logger.info('Client unsubscribed from events', {
      socketId: socket.id,
      events,
    });

    socket.emit('unsubscribed', {
      events,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnect(socket: Socket): void {
    const socketData = socket.data as BridgeSocketData;
    
    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      companyId: socketData.companyId,
    });

    // Remove from company room
    if (socketData.companyId) {
      this.removeFromCompanyRoom(socketData.companyId, socket.id);
    }

    // Clean up
    this.connections.delete(socket.id);
    this.eventSubscriptions.delete(socket.id);
  }

  private addToCompanyRoom(companyId: number, socketId: string): void {
    if (!this.companyRooms.has(companyId)) {
      this.companyRooms.set(companyId, new Set());
    }
    this.companyRooms.get(companyId)!.add(socketId);
  }

  private removeFromCompanyRoom(companyId: number, socketId: string): void {
    const room = this.companyRooms.get(companyId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.companyRooms.delete(companyId);
      }
    }
  }

  /**
   * Emit event to specific company
   */
  public emitToCompany(companyId: number, event: string, data: any): void {
    const roomName = `company:${companyId}`;
    this.bridgeNamespace.to(roomName).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    logger.debug('Event emitted to company', {
      companyId,
      event,
      roomName,
    });
  }

  /**
   * Emit event to specific user
   */
  public emitToUser(userId: number, event: string, data: any): void {
    this.connections.forEach((socket) => {
      const socketData = socket.data as BridgeSocketData;
      if (socketData.userId === userId) {
        socket.emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    logger.debug('Event emitted to user', {
      userId,
      event,
    });
  }

  /**
   * Emit event to subscribers
   */
  public emitEvent(event: string, data: any, companyId?: number): void {
    const eventRoom = `event:${event}`;
    let payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    if (companyId) {
      // Emit to company subscribers only
      const companyRoom = `company:${companyId}`;
      this.bridgeNamespace.to(companyRoom).to(eventRoom).emit(event, payload);
    } else {
      // Emit to all subscribers
      this.bridgeNamespace.to(eventRoom).emit(event, payload);
    }

    logger.debug('Event emitted', {
      event,
      companyId,
      eventRoom,
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.bridgeNamespace.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    logger.debug('Event broadcasted', { event });
  }

  /**
   * Get connected clients count
   */
  public getConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * Get company connections count
   */
  public getCompanyConnectionsCount(companyId: number): number {
    return this.companyRooms.get(companyId)?.size || 0;
  }

  /**
   * Get all active companies
   */
  public getActiveCompanies(): number[] {
    return Array.from(this.companyRooms.keys());
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    for (const socket of this.connections.values()) {
      const socketData = socket.data as BridgeSocketData;
      if (socketData.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      totalConnections: this.connections.size,
      activeCompanies: this.companyRooms.size,
      companyDetails: Array.from(this.companyRooms.entries()).map(([companyId, sockets]) => ({
        companyId,
        connections: sockets.size,
      })),
      eventSubscriptions: Array.from(this.eventSubscriptions.entries()).map(([socketId, sub]) => ({
        socketId,
        events: sub.events,
      })),
    };
  }

  /**
   * Disconnect all clients from a company
   */
  public disconnectCompany(companyId: number): void {
    const room = this.companyRooms.get(companyId);
    if (room) {
      room.forEach(socketId => {
        const socket = this.connections.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });
    }
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get the Bridge namespace
   */
  public getNamespace(): Namespace {
    return this.bridgeNamespace;
  }
}

// Export singleton instance will be created in server.ts
export default WebSocketService;