// ─── Room Types ───────────────────────────────────────────────

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  hintsEnabled: boolean;
  customWords: string[];
  isPrivate: boolean;
  gameMode: 'classic' | 'speed' | 'casual';
}

export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  settings: RoomSettings;
  players: RoomPlayer[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
}

export interface PublicRoom {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
  gameMode: string;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordDifficulty: 'mixed',
  hintsEnabled: true,
  customWords: [],
  isPrivate: false,
  gameMode: 'classic',
};
