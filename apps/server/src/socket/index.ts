import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@scribble/shared';
import { RoomManager } from '../engine/RoomManager.js';
import { registerRoomHandlers } from './handlers/room.js';
import { registerGameHandlers } from './handlers/game.js';
import { registerDrawingHandlers } from './handlers/drawing.js';
import { registerChatHandlers } from './handlers/chat.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export function setupSocketIO(fastify: FastifyInstance): void {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    fastify.server,
    {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
      perMessageDeflate: {
        threshold: 1024,
      },
    }
  );
  // const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  // const subClient = pubClient.duplicate();
  // io.adapter(createAdapter(pubClient, subClient));

  const roomManager = new RoomManager(io);

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT
      const decoded = fastify.jwt.verify<{ id: string; username: string }>(token);
      socket.data.userId = decoded.id;
      socket.data.username = decoded.username;
      socket.data.roomId = null;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.data.username} (${socket.data.userId})`);

    // Register handlers
    registerRoomHandlers(socket, roomManager);
    registerGameHandlers(socket, roomManager);
    registerDrawingHandlers(socket, roomManager);
    registerChatHandlers(socket, roomManager);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.data.username} (${reason})`);
    });
  });

  console.log('[Socket] Socket.IO initialized');
}
