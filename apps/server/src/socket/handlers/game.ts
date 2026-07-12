// ─── Game Socket Handlers ─────────────────────────────────────

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@scribble/shared';
import { GAME_CONFIG } from '@scribble/shared';
import type { RoomManager } from '../../engine/RoomManager.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(socket: TypedSocket, roomManager: RoomManager): void {
  // ─── game:start ──────────────────────────────────────────────
  socket.on('game:start', () => {
    try {
      const { userId, username, roomId } = socket.data;
      if (!roomId) {
        socket.emit('error', 'Not in a room');
        return;
      }

      const managed = roomManager.getRoom(roomId);
      if (!managed) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Only host can start
      if (managed.info.hostId !== userId) {
        socket.emit('error', 'Only the host can start the game');
        return;
      }

      // Check minimum players
      const onlinePlayers = managed.info.players.filter((p) => p.isOnline);
      if (onlinePlayers.length < GAME_CONFIG.MIN_PLAYERS) {
        socket.emit('error', `Need at least ${GAME_CONFIG.MIN_PLAYERS} players to start`);
        return;
      }

      console.log(`[Socket:Game] ${username} starting game in room ${managed.info.code}`);

      const started = managed.engine.startGame();
      if (!started) {
        socket.emit('error', 'Failed to start game');
        return;
      }

      // Update room status
      managed.info.status = 'playing';
      socket.to(roomId).emit('room:updated', managed.info);
      socket.emit('room:updated', managed.info);

      // Notify
      socket.nsp.to(roomId).emit('notification', {
        type: 'success',
        message: 'Game started!',
      });
    } catch (error) {
      console.error('[Socket:Game] Start error:', error);
      socket.emit('error', 'Failed to start game');
    }
  });

  // ─── game:selectWord ─────────────────────────────────────────
  socket.on('game:selectWord', (word: string) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      // Only the current drawer can select
      const currentDrawerId = managed.engine.getCurrentDrawerId();
      if (currentDrawerId !== userId) {
        socket.emit('error', 'You are not the current drawer');
        return;
      }

      console.log(`[Socket:Game] Word selected by ${socket.data.username}`);
      managed.engine.selectWord(word);
    } catch (error) {
      console.error('[Socket:Game] Select word error:', error);
    }
  });

  // ─── game:guess ──────────────────────────────────────────────
  socket.on('game:guess', (guess: string) => {
    try {
      const { userId, username, roomId } = socket.data;
      if (!roomId) return;
      if (!guess || guess.trim().length === 0) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      const result = managed.engine.handleGuess(userId, guess);

      if (result.correct) {
        // Send "correct" chat message
        socket.nsp.to(roomId).emit('chat:message', {
          id: `guess_${Date.now()}_${userId}`,
          userId,
          username,
          content: `${username} guessed the word!`,
          type: 'correct',
          timestamp: Date.now(),
        });
      } else if (result.close) {
        // Send "close" notification only to the guesser
        socket.emit('chat:message', {
          id: `close_${Date.now()}_${userId}`,
          userId: 'system',
          username: 'System',
          content: `"${guess}" is very close!`,
          type: 'close',
          timestamp: Date.now(),
        });
        // Also broadcast as a regular guess to others
        socket.to(roomId).emit('chat:message', {
          id: `msg_${Date.now()}_${userId}`,
          userId,
          username,
          content: guess,
          type: 'guess',
          timestamp: Date.now(),
        });
      } else {
        // Regular wrong guess — show in chat
        socket.nsp.to(roomId).emit('chat:message', {
          id: `msg_${Date.now()}_${userId}`,
          userId,
          username,
          content: guess,
          type: 'guess',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('[Socket:Game] Guess error:', error);
    }
  });
}
