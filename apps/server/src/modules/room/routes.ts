// ─── Room Routes ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { RoomManager } from '../../engine/RoomManager.js';

// The room manager is set after socket setup
let roomManager: RoomManager | null = null;

export function setRoomManager(manager: RoomManager): void {
  roomManager = manager;
}

export async function roomRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/rooms — List public rooms
  fastify.get('/api/rooms', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!roomManager) {
        return reply.status(503).send({ error: 'Server not ready' });
      }
      const rooms = roomManager.listPublicRooms();
      return reply.send(rooms);
    } catch (error) {
      console.error('[Rooms] List error:', error);
      return reply.status(500).send({ error: 'Failed to list rooms' });
    }
  });

  // GET /api/rooms/:code — Get room info by code
  fastify.get<{ Params: { code: string } }>(
    '/api/rooms/:code',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      try {
        if (!roomManager) {
          return reply.status(503).send({ error: 'Server not ready' });
        }

        const { code } = request.params;
        const managed = roomManager.getRoomByCode(code);

        if (!managed) {
          return reply.status(404).send({ error: 'Room not found' });
        }

        return reply.send(managed.info);
      } catch (error) {
        console.error('[Rooms] Get room error:', error);
        return reply.status(500).send({ error: 'Failed to get room' });
      }
    }
  );
}
