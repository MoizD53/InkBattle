import type { Server } from 'socket.io';
import type { RoomInfo, RoomSettings, RoomPlayer, PublicRoom } from '@scribble/shared';
import { DEFAULT_ROOM_SETTINGS, GAME_CONFIG } from '@scribble/shared';

// For MVP single-node, we use in-memory maps.
// For Redis scalability (Question 1 pending), this would use Redis Hashes.
export class RoomService {
  private rooms: Map<string, RoomInfo> = new Map();
  private codeToId: Map<string, string> = new Map();

  constructor() {}

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

    this.rooms.set(id, roomInfo);
    this.codeToId.set(code, id);

    return roomInfo;
  }

  getRoom(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): RoomInfo | undefined {
    const roomId = this.codeToId.get(code.toUpperCase());
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  updateRoomStatus(roomId: string, status: RoomInfo['status']): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
    }
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.codeToId.delete(room.code);
      this.rooms.delete(roomId);
    }
  }

  listPublicRooms(): PublicRoom[] {
    const publicRooms: PublicRoom[] = [];
    for (const room of this.rooms.values()) {
      if (room.settings.isPrivate || room.status === 'finished') continue;
      
      const hostPlayer = room.players.find(p => p.id === room.hostId);
      publicRooms.push({
        id: room.id,
        code: room.code,
        hostName: hostPlayer?.username ?? 'Unknown',
        playerCount: room.players.filter(p => p.isOnline).length,
        maxPlayers: room.settings.maxPlayers,
        status: room.status === 'waiting' ? 'waiting' : 'playing',
        gameMode: room.settings.gameMode,
      });
    }
    return publicRooms.slice(0, GAME_CONFIG.MAX_PUBLIC_ROOMS);
  }

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
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `room_${timestamp}${random}`;
  }
}
