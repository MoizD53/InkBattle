// ─── Drawing Socket Handlers ──────────────────────────────────

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  DrawingAction,
} from '@scribble/shared';
import type { RoomManager } from '../../engine/RoomManager.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerDrawingHandlers(socket: TypedSocket, roomManager: RoomManager): void {
  // ─── draw:action ─────────────────────────────────────────────
  socket.on('draw:action', (action: DrawingAction) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      managed.engine.relayDrawAction(userId, action);
    } catch (error) {
      console.error('[Socket:Drawing] Action error:', error);
    }
  });

  // ─── draw:batch ──────────────────────────────────────────────
  socket.on('draw:batch', (actions: DrawingAction[]) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      managed.engine.relayDrawBatch(userId, actions);
    } catch (error) {
      console.error('[Socket:Drawing] Batch error:', error);
    }
  });

  // ─── draw:request-snapshot ───────────────────────────────────
  socket.on('draw:request-snapshot', () => {
    try {
      const { roomId } = socket.data;
      if (!roomId) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      // Send snapshot to the requesting client
      const snapshot = managed.engine.getCanvasSnapshot();
      if (snapshot) {
        socket.emit('draw:snapshot', snapshot);
      }
    } catch (error) {
      console.error('[Socket:Drawing] Snapshot request error:', error);
    }
  });
}
