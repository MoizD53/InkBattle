import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { config } from './config/index.js';
import { authRoutes } from './modules/auth/routes.js';
import { roomRoutes } from './modules/room/routes.js';
import { setupSocketIO } from './socket/index.js';
import { prisma } from './lib/prisma.js';

async function buildApp() {
  const fastify = Fastify({
    logger: true,
  });

  // Plugins
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // Routes
  await fastify.register(authRoutes);
  await fastify.register(roomRoutes);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildApp();
    
    // Setup Socket.IO
    setupSocketIO(fastify);

    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🚀 Server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
