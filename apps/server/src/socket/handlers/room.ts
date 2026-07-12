// ─── Room Socket Handlers ─────────────────────────────────────

import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RoomSettings,
  RoomInfo,
} from '@scribble/shared';
import type { RoomManager } from '../../engine/RoomManager.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerRoomHandlers(socket: TypedSocket, roomManager: RoomManager): void {
  // ─── room:create ─────────────────────────────────────────────
  socket.on('room:create', (settings: Partial<RoomSettings>, cb) => {
    try {
      const { userId, username } = socket.data;
      console.log(`[Socket:Room] ${username} creating room`);

      // Leave current room if in one
      if (socket.data.roomId) {
        const oldRoomId = socket.data.roomId;
        socket.leave(oldRoomId);
        roomManager.leaveRoom(oldRoomId, userId);
        socket.data.roomId = null;
      }

      const roomInfo = roomManager.createRoom(userId, username, '', settings);

      // Join socket room
      socket.join(roomInfo.id);
      socket.data.roomId = roomInfo.id;

      console.log(`[Socket:Room] Room created: ${roomInfo.code}`);
      cb(roomInfo);
    } catch (error) {
      console.error('[Socket:Room] Create error:', error);
      socket.emit('error', 'Failed to create room');
      cb({ id: '', code: '', hostId: '', settings: {} as RoomSettings, players: [], status: 'waiting', createdAt: '' });
    }
  });

  // ─── room:join ───────────────────────────────────────────────
  socket.on('room:join', (code: string, cb) => {
    try {
      const { userId, username } = socket.data;
      console.log(`[Socket:Room] ${username} joining room ${code}`);

      const targetRoomId = roomManager.getRoomIdByCode(code);

      // Leave current room if in a DIFFERENT one
      if (socket.data.roomId && socket.data.roomId !== targetRoomId) {
        const oldRoomId = socket.data.roomId;
        socket.leave(oldRoomId);
        roomManager.leaveRoom(oldRoomId, userId);
        socket.data.roomId = null;
      }

      const roomInfo = roomManager.joinRoom(code, {
        id: userId,
        username,
        avatar: '',
      });

      if (!roomInfo) {
        console.log(`[Socket:Room] Room ${code} not found or full`);
        cb(null, 'Room not found or full');
        return;
      }

      // Join socket room
      socket.join(roomInfo.id);
      socket.data.roomId = roomInfo.id;

      // Notify others
      const player = roomInfo.players.find((p) => p.id === userId);
      if (player) {
        socket.to(roomInfo.id).emit('room:playerJoined', player);
      }

      // Send system chat message
      socket.to(roomInfo.id).emit('chat:message', {
        id: `sys_${Date.now()}`,
        userId: 'system',
        username: 'System',
        content: `${username} joined the room`,
        type: 'join',
        timestamp: Date.now(),
      });

      // Send room update to all
      socket.to(roomInfo.id).emit('room:updated', roomInfo);

      // Send snapshot if game is in progress
      const managed = roomManager.getRoom(roomInfo.id);
      if (managed) {
        const snapshot = managed.engine.getCanvasSnapshot();
        if (snapshot) {
          socket.emit('draw:snapshot', snapshot);
        }
        // Send current game state
        socket.emit('game:state', managed.engine.getState());
      }

      console.log(`[Socket:Room] ${username} joined room ${code}`);
      cb(roomInfo);
    } catch (error) {
      console.error('[Socket:Room] Join error:', error);
      socket.emit('error', 'Failed to join room');
      cb(null, 'Internal error');
    }
  });

  // ─── room:leave ──────────────────────────────────────────────
  socket.on('room:leave', () => {
    handleLeaveRoom(socket, roomManager);
  });

  // ─── room:ready ──────────────────────────────────────────────
  socket.on('room:ready', (ready: boolean) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const managed = roomManager.getRoom(roomId);
      if (!managed) return;

      const player = managed.info.players.find((p) => p.id === userId);
      if (player) {
        player.isReady = ready;
        console.log(`[Socket:Room] ${player.username} ready: ${ready}`);
        socket.to(roomId).emit('room:updated', managed.info);
      }
    } catch (error) {
      console.error('[Socket:Room] Ready error:', error);
    }
  });

  // ─── room:settings ──────────────────────────────────────────
  socket.on('room:settings', (settings: Partial<RoomSettings>) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const success = roomManager.updateSettings(roomId, userId, settings);
      if (success) {
        const managed = roomManager.getRoom(roomId);
        if (managed) {
          console.log(`[Socket:Room] Settings updated by ${socket.data.username}`);
          socket.to(roomId).emit('room:updated', managed.info);
          // Also send back to the requester
          socket.emit('room:updated', managed.info);
        }
      } else {
        socket.emit('error', 'Only the host can change settings');
      }
    } catch (error) {
      console.error('[Socket:Room] Settings error:', error);
    }
  });

  // ─── room:kick ───────────────────────────────────────────────
  socket.on('room:kick', (playerId: string) => {
    try {
      const { userId, roomId } = socket.data;
      if (!roomId) return;

      const success = roomManager.kickPlayer(roomId, userId, playerId);
      if (success) {
        console.log(`[Socket:Room] ${socket.data.username} kicked ${playerId}`);

        // Notify the kicked player
        const kickedSockets = socket.nsp.sockets;
        for (const [, s] of kickedSockets) {
          if (s.data.userId === playerId) {
            s.emit('room:closed', 'You were kicked from the room');
            s.leave(roomId);
            s.data.roomId = null;
          }
        }

        // Notify remaining
        socket.to(roomId).emit('room:playerLeft', playerId);
        const managed = roomManager.getRoom(roomId);
        if (managed) {
          socket.to(roomId).emit('room:updated', managed.info);
          socket.emit('room:updated', managed.info);
        }
      } else {
        socket.emit('error', 'Only the host can kick players');
      }
    } catch (error) {
      console.error('[Socket:Room] Kick error:', error);
    }
  });

  // ─── Handle disconnect ──────────────────────────────────────
  socket.on('disconnect', () => {
    handleLeaveRoom(socket, roomManager);
  });
}

function handleLeaveRoom(socket: TypedSocket, roomManager: RoomManager): void {
  const { userId, username, roomId } = socket.data;
  if (!roomId) return;

  console.log(`[Socket:Room] ${username} leaving room`);

  socket.leave(roomId);
  roomManager.leaveRoom(roomId, userId);
  socket.data.roomId = null;

  // Notify others
  socket.to(roomId).emit('room:playerLeft', userId);
  socket.to(roomId).emit('chat:message', {
    id: `sys_${Date.now()}`,
    userId: 'system',
    username: 'System',
    content: `${username} left the room`,
    type: 'leave',
    timestamp: Date.now(),
  });

  // Send updated room info
  const managed = roomManager.getRoom(roomId);
  if (managed) {
    socket.to(roomId).emit('room:updated', managed.info);
  }
}
