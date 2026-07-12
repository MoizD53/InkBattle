/** Game configuration constants */

export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 12,
  DEFAULT_ROUNDS: 3,
  DEFAULT_DRAW_TIME: 80,
  WORD_CHOICES: 3,
  COUNTDOWN_SECONDS: 5,
  REVEAL_DURATION: 5,
  SCORING_DURATION: 5,

  // Scoring
  MAX_GUESS_SCORE: 500,
  MIN_GUESS_SCORE: 100,
  DRAWER_BASE_SCORE: 100,
  DRAWER_PER_GUESS_BONUS: 50,
  STREAK_BONUS: 50,
  SPEED_BONUS_MULTIPLIER: 1.5,

  // Hints
  HINT_INTERVAL_PERCENT: 0.3, // reveal a letter every 30% of time
  FIRST_HINT_PERCENT: 0.4, // first hint at 40% time elapsed

  // Room
  ROOM_CODE_LENGTH: 6,
  ROOM_IDLE_TIMEOUT: 600_000, // 10 minutes
  MAX_PUBLIC_ROOMS: 50,
} as const;

/** Drawing palette colors */
export const DRAWING_COLORS = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0',
  '#EF4444', '#DC2626', '#F97316', '#EA580C',
  '#EAB308', '#CA8A04', '#22C55E', '#16A34A',
  '#06B6D4', '#0891B2', '#3B82F6', '#2563EB',
  '#8B5CF6', '#7C3AED', '#EC4899', '#DB2777',
  '#78350F', '#92400E', '#FDE68A', '#FCA5A5',
] as const;

export const BRUSH_SIZES = [2, 4, 8, 12, 20, 32] as const;
