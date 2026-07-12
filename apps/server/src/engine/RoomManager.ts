// ─── Room Manager ─────────────────────────────────────────────
// Manages all active rooms and their GameEngine instances

import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RoomInfo,
  RoomSettings,
  RoomPlayer,
  PublicRoom,
} from '@scribble/shared';
import { DEFAULT_ROOM_SETTINGS, GAME_CONFIG } from '@scribble/shared';
import { GameRoom } from './GameRoom.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface ManagedRoom {
  info: RoomInfo;
  engine: GameRoom;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

export class RoomManager {
  private rooms: Map<string, ManagedRoom> = new Map();
  private codeToId: Map<string, string> = new Map();
  private io: TypedIO;

  constructor(io: TypedIO) {
    this.io = io;
    console.log('[RoomManager] Initialized');
  }

  // ─── Room CRUD ──────────────────────────────────────────────

  createRoom(hostId: string, hostUsername: string, hostAvatar: string, settings?: Partial<RoomSettings>): RoomInfo {
    const id = this.generateId();
    const code = this.generateRoomCode();
    const mergedSettings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS, ...settings };

    const hostPlayer: RoomPlayer = {
      id: hostId,
      username: hostUsername,
      avatar: hostAvatar,
      isHost: true,
      isReady: true,
      isOnline: true,
    };

    const roomInfo: RoomInfo = {
      id,
      code,
      hostId,
      settings: mergedSettings,
      players: [hostPlayer],
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    const engine = new GameRoom(this.io, id, code, hostId, mergedSettings);
    engine.addPlayer(hostPlayer);

    const managed: ManagedRoom = {
      info: roomInfo,
      engine,
      idleTimer: null,
    };

    this.rooms.set(id, managed);
    this.codeToId.set(code, id);

    // Start idle timer
    this.resetIdleTimer(id);

    console.log(`[RoomManager] Room created: ${code} (${id}) by ${hostUsername}`);
    return roomInfo;
  }

  joinRoom(code: string, player: { id: string; username: string; avatar: string }): RoomInfo | null {
    const roomId = this.codeToId.get(code.toUpperCase());
    if (!roomId) return null;

    const managed = this.rooms.get(roomId);
    if (!managed) return null;

    const { info, engine } = managed;

    // Check if room is full
    if (info.players.length >= info.settings.maxPlayers) {
      return null;
    }

    // Check if player is already in room
    const existingPlayer = info.players.find((p) => p.id === player.id);
    if (existingPlayer) {
      existingPlayer.isOnline = true;
      engine.addPlayer(existingPlayer);
      this.resetIdleTimer(roomId);
      return this.getSyncedRoomInfo(roomId);
    }

    const roomPlayer: RoomPlayer = {
      id: player.id,
      username: player.username,
      avatar: player.avatar,
      isHost: false,
      isReady: false,
      isOnline: true,
    };

    info.players.push(roomPlayer);
    engine.addPlayer(roomPlayer);
    this.resetIdleTimer(roomId);

    console.log(`[RoomManager] ${player.username} joined room ${code}`);
    return this.getSyncedRoomInfo(roomId);
  }

  leaveRoom(roomId: string, playerId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;

    const { info, engine } = managed;

    // Remove from engine
    const shouldCleanup = engine.removePlayer(playerId);

    // Remove from player list or mark offline
    const playerIndex = info.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
      info.players[playerIndex]!.isOnline = false;
    }

    // Update host if needed
    if (playerId === info.hostId) {
      const newHost = info.players.find((p) => p.isOnline);
      if (newHost) {
        info.hostId = newHost.id;
        newHost.isHost = true;
        // Remove host from previous
        const oldHostPlayer = info.players.find((p) => p.id === playerId);
        if (oldHostPlayer) oldHostPlayer.isHost = false;
      }
    }

    const onlinePlayers = info.players.filter((p) => p.isOnline);
    console.log(`[RoomManager] Player ${playerId} left room ${info.code}. Online: ${onlinePlayers.length}`);

    if (shouldCleanup) {
      this.destroyRoom(roomId);
    } else {
      this.resetIdleTimer(roomId);
    }
  }

  kickPlayer(roomId: string, requesterId: string, targetId: string): boolean {
    const managed = this.rooms.get(roomId);
    if (!managed) return false;

    // Only host can kick
    if (managed.info.hostId !== requesterId) return false;

    // Can't kick yourself
    if (requesterId === targetId) return false;

    this.leaveRoom(roomId, targetId);
    return true;
  }

  // ─── Room Queries ───────────────────────────────────────────

  getRoom(roomId: string): ManagedRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): ManagedRoom | undefined {
    const roomId = this.codeToId.get(code.toUpperCase());
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getRoomIdByCode(code: string): string | undefined {
    return this.codeToId.get(code.toUpperCase());
  }

  listPublicRooms(): PublicRoom[] {
    const publicRooms: PublicRoom[] = [];

    for (const managed of this.rooms.values()) {
      const { info } = managed;
      if (info.settings.isPrivate) continue;
      if (info.status === 'finished') continue;

      const hostPlayer = info.players.find((p) => p.id === info.hostId);
      publicRooms.push({
        id: info.id,
        code: info.code,
        hostName: hostPlayer?.username ?? 'Unknown',
        playerCount: info.players.filter((p) => p.isOnline).length,
        maxPlayers: info.settings.maxPlayers,
        status: info.status === 'waiting' ? 'waiting' : 'playing',
        gameMode: info.settings.gameMode,
      });
    }

    return publicRooms.slice(0, GAME_CONFIG.MAX_PUBLIC_ROOMS);
  }

  findPlayerRoom(playerId: string): string | null {
    for (const [roomId, managed] of this.rooms) {
      if (managed.info.players.some((p) => p.id === playerId && p.isOnline)) {
        return roomId;
      }
    }
    return null;
  }

  // ─── Settings ───────────────────────────────────────────────

  updateSettings(roomId: string, requesterId: string, settings: Partial<RoomSettings>): boolean {
    const managed = this.rooms.get(roomId);
    if (!managed) return false;

    // Only host can update settings
    if (managed.info.hostId !== requesterId) return false;

    managed.info.settings = { ...managed.info.settings, ...settings };
    managed.engine.updateSettings(settings);
    return true;
  }

  // ─── Room Lifecycle ─────────────────────────────────────────

  private destroyRoom(roomId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;

    console.log(`[RoomManager] Destroying room ${managed.info.code} (${roomId})`);

    if (managed.idleTimer) clearTimeout(managed.idleTimer);
    managed.engine.destroy();

    this.codeToId.delete(managed.info.code);
    this.rooms.delete(roomId);

    // Notify remaining sockets
    this.io.to(roomId).emit('room:closed', 'Room has been closed');
  }

  private resetIdleTimer(roomId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;

    if (managed.idleTimer) clearTimeout(managed.idleTimer);

    managed.idleTimer = setTimeout(() => {
      console.log(`[RoomManager] Room ${managed.info.code} idle timeout, destroying`);
      this.destroyRoom(roomId);
    }, GAME_CONFIG.ROOM_IDLE_TIMEOUT);
  }

  // ─── Sync Helper ────────────────────────────────────────────

  private getSyncedRoomInfo(roomId: string): RoomInfo | null {
    const managed = this.rooms.get(roomId);
    if (!managed) return null;

    const engine = managed.engine;
    managed.info.hostId = engine.hostId;
    managed.info.status = engine.getPhase() === 'waiting' || engine.getPhase() === 'finished' ? 'waiting' : 'playing';

    return managed.info;
  }

  // ─── Utilities ──────────────────────────────────────────────

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
      code = '';
      for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.codeToId.has(code));
    return code;
  }

  private generateId(): string {
    // Simple cuid-like ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `room_${timestamp}${random}`;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
