import type { GameState, RoundResult, GameResult } from './game.js';
import type { DrawingAction, CanvasSnapshot } from './drawing.js';
import type { RoomInfo, RoomSettings, RoomPlayer, PublicRoom } from './room.js';
import type { ChatMessage } from './chat.js';

// ─── Client → Server Events ──────────────────────────────────

export interface ClientToServerEvents {
  // Room
  'room:create': (settings: Partial<RoomSettings>, cb: (room: RoomInfo) => void) => void;
  'room:join': (code: string, cb: (room: RoomInfo | null, error?: string) => void) => void;
  'room:leave': () => void;
  'room:ready': (ready: boolean) => void;
  'room:settings': (settings: Partial<RoomSettings>) => void;
  'room:kick': (playerId: string) => void;

  // Game
  'game:start': () => void;
  'game:selectWord': (word: string) => void;
  'game:guess': (guess: string) => void;

  // Drawing
  'draw:action': (action: DrawingAction) => void;
  'draw:batch': (actions: DrawingAction[]) => void;
  'draw:request-snapshot': () => void;

  // Chat
  'chat:message': (content: string) => void;
}

// ─── Server → Client Events ──────────────────────────────────

export interface ServerToClientEvents {
  // Room
  'room:updated': (room: RoomInfo) => void;
  'room:playerJoined': (player: RoomPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:closed': (reason: string) => void;
  'room:list': (rooms: PublicRoom[]) => void;

  // Game
  'game:state': (state: GameState) => void;
  'game:countdown': (seconds: number) => void;
  'game:wordChoices': (words: string[]) => void;
  'game:hint': (hint: string) => void;
  'game:correctGuess': (userId: string, username: string) => void;
  'game:closeGuess': (userId: string) => void;
  'game:roundResult': (result: RoundResult) => void;
  'game:finished': (result: GameResult) => void;
  'game:scoreUpdate': (scores: Record<string, number>) => void;

  // Drawing
  'draw:action': (action: DrawingAction) => void;
  'draw:batch': (actions: DrawingAction[]) => void;
  'draw:snapshot': (snapshot: CanvasSnapshot) => void;
  'draw:clear': () => void;

  // Chat
  'chat:message': (message: ChatMessage) => void;

  // System
  'error': (message: string) => void;
  'notification': (notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;
}

// ─── Inter-Server Events (for scaling) ──────────────────────

export interface InterServerEvents {
  ping: () => void;
}

// ─── Socket Data ──────────────────────────────────────────────

export interface SocketData {
  userId: string;
  username: string;
  roomId: string | null;
}
