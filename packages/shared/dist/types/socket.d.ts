import type { GameState, RoundResult, GameResult } from './game.js';
import type { DrawingAction, CanvasSnapshot } from './drawing.js';
import type { RoomInfo, RoomSettings, RoomPlayer, PublicRoom } from './room.js';
import type { ChatMessage } from './chat.js';
export interface ClientToServerEvents {
    'room:create': (settings: Partial<RoomSettings>, cb: (room: RoomInfo) => void) => void;
    'room:join': (code: string, cb: (room: RoomInfo | null, error?: string) => void) => void;
    'room:leave': () => void;
    'room:ready': (ready: boolean) => void;
    'room:settings': (settings: Partial<RoomSettings>) => void;
    'room:kick': (playerId: string) => void;
    'game:start': () => void;
    'game:selectWord': (word: string) => void;
    'game:guess': (guess: string) => void;
    'draw:action': (action: DrawingAction) => void;
    'draw:batch': (actions: DrawingAction[]) => void;
    'draw:request-snapshot': () => void;
    'chat:message': (content: string) => void;
}
export interface ServerToClientEvents {
    'room:updated': (room: RoomInfo) => void;
    'room:playerJoined': (player: RoomPlayer) => void;
    'room:playerLeft': (playerId: string) => void;
    'room:closed': (reason: string) => void;
    'room:list': (rooms: PublicRoom[]) => void;
    'game:state': (state: GameState) => void;
    'game:countdown': (seconds: number) => void;
    'game:wordChoices': (words: string[]) => void;
    'game:hint': (hint: string) => void;
    'game:correctGuess': (userId: string, username: string) => void;
    'game:closeGuess': (userId: string) => void;
    'game:roundResult': (result: RoundResult) => void;
    'game:finished': (result: GameResult) => void;
    'game:scoreUpdate': (scores: Record<string, number>) => void;
    'draw:action': (action: DrawingAction) => void;
    'draw:batch': (actions: DrawingAction[]) => void;
    'draw:snapshot': (snapshot: CanvasSnapshot) => void;
    'draw:clear': () => void;
    'chat:message': (message: ChatMessage) => void;
    'error': (message: string) => void;
    'notification': (notification: {
        type: 'info' | 'success' | 'warning' | 'error';
        message: string;
    }) => void;
}
export interface InterServerEvents {
    ping: () => void;
}
export interface SocketData {
    userId: string;
    username: string;
    roomId: string | null;
}
//# sourceMappingURL=socket.d.ts.map