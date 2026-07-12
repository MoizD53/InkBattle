// ─── Game State ──────────────────────────────────────────────

export type GamePhase =
  | 'waiting'
  | 'starting'
  | 'selecting'
  | 'drawing'
  | 'reveal'
  | 'scoring'
  | 'finished';

export type GameMode =
  | 'classic'
  | 'speed'
  | 'team'
  | 'casual';

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  word: string | null;
  hint: string;
  timeLeft: number;
  totalTime: number;
  players: PlayerState[];
  correctGuessers: string[];
  wordChoices?: string[];
  scores: Record<string, number>;
}

export interface PlayerState {
  id: string;
  username: string;
  avatar: string;
  score: number;
  isDrawing: boolean;
  hasGuessed: boolean;
  isOnline: boolean;
  streak: number;
}

export interface RoundResult {
  round: number;
  word: string;
  drawerId: string;
  drawerScore: number;
  guessers: GuesserResult[];
  timeElapsed: number;
}

export interface GuesserResult {
  playerId: string;
  username: string;
  timeToGuess: number;
  score: number;
}

export interface GameResult {
  winnerId: string;
  players: {
    id: string;
    username: string;
    avatar: string;
    totalScore: number;
    rank: number;
    correctGuesses: number;
    drawingScore: number;
  }[];
  totalRounds: number;
  duration: number;
}

// ─── Scoring ──────────────────────────────────────────────────

export interface ScoreEvent {
  playerId: string;
  points: number;
  reason: 'correct_guess' | 'drawer_bonus' | 'streak_bonus' | 'speed_bonus';
}
