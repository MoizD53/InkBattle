// ─── Auth Routes ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { GuestLoginRequest, AuthResponse, User } from '@scribble/shared';
import { prisma } from '../../lib/prisma.js';

// Avatar generation helper
function generateAvatar(username: string): string {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const colorIndex = Math.abs(username.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % colors.length;
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}&backgroundColor=${colors[colorIndex]}`;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/auth/guest — Guest login
  fastify.post<{ Body: GuestLoginRequest }>(
    '/api/auth/guest',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string', minLength: 2, maxLength: 20 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GuestLoginRequest }>, reply: FastifyReply) => {
      try {
        const { username } = request.body;

        console.log(`[Auth] Guest login request: "${username}"`);

        // Create user in database
        const avatar = generateAvatar(username);
        const dbUser = await prisma.user.create({
          data: {
            username,
            avatar,
            isGuest: true,
          },
        });

        // Build user response
        const user: User = {
          id: dbUser.id,
          username: dbUser.username,
          avatar: dbUser.avatar,
          isGuest: dbUser.isGuest,
          level: dbUser.level,
          xp: dbUser.xp,
          wins: dbUser.wins,
          gamesPlayed: dbUser.gamesPlayed,
          totalScore: dbUser.totalScore,
        };

        // Issue JWT
        const token = fastify.jwt.sign(
          { id: user.id, username: user.username },
          { expiresIn: '7d' }
        );

        const response: AuthResponse = { token, user };
        console.log(`[Auth] Guest user created: ${user.username} (${user.id})`);

        return reply.status(201).send(response);
      } catch (error) {
        console.error('[Auth] Guest login error:', error);
        return reply.status(500).send({ error: 'Failed to create guest user' });
      }
    }
  );

  // GET /api/auth/me — Get current user
  fastify.get(
    '/api/auth/me',
    {
      preHandler: [async (request: FastifyRequest) => {
        try {
          await request.jwtVerify();
        } catch {
          throw new Error('Unauthorized');
        }
      }],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.user as { id: string; username: string };
        const dbUser = await prisma.user.findUnique({ where: { id: payload.id } });

        if (!dbUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const user: User = {
          id: dbUser.id,
          username: dbUser.username,
          avatar: dbUser.avatar,
          isGuest: dbUser.isGuest,
          level: dbUser.level,
          xp: dbUser.xp,
          wins: dbUser.wins,
          gamesPlayed: dbUser.gamesPlayed,
          totalScore: dbUser.totalScore,
        };

        return reply.send(user);
      } catch (error) {
        console.error('[Auth] Get user error:', error);
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    }
  );
}
