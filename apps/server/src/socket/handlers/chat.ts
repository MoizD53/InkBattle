// ─── Chat Socket Handlers ─────────────────────────────────────

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@scribble/shared';
import type { RoomManager } from '../../engine/RoomManager.js';
import { containsProfanity, filterProfanity } from '../../utils/profanity.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerChatHandlers(socket: TypedSocket, roomManager: RoomManager): void {
  // ─── chat:message ────────────────────────────────────────────
  socket.on('chat:message', (content: string) => {
    try {
      const { userId, username, roomId } = socket.data;
      if (!roomId) return;
      if (!content || content.trim().length === 0) return;

      // Limit message length
      const trimmedContent = content.trim().slice(0, 200);

      // Check for profanity and filter
      let finalContent = trimmedContent;
      if (containsProfanity(trimmedContent)) {
        finalContent = filterProfanity(trimmedContent);
        console.log(`[Socket:Chat] Profanity filtered from ${username}: "${trimmedContent}" → "${finalContent}"`);
      }

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      // If the game is in drawing phase, the message might be a guess
      // But chat:message is specifically for non-guess chat
      // The client should use game:guess for guesses during drawing

      const message = {
        id: `chat_${Date.now()}_${userId}`,
        userId,
        username,
        content: finalContent,
        type: 'message' as const,
        timestamp: Date.now(),
      };

      // Broadcast to entire room including sender
      socket.nsp.to(roomId).emit('chat:message', message);
    } catch (error) {
      console.error('[Socket:Chat] Message error:', error);
    }
  });
}
