// ─── Scoring Utilities ────────────────────────────────────────

import { GAME_CONFIG } from '@scribble/shared';

/**
 * Calculate score for a correct guess based on remaining time.
 * Linear interpolation between MAX and MIN guess scores.
 */
export function calculateGuessScore(timeLeft: number, totalTime: number): number {
  const ratio = Math.max(0, Math.min(1, timeLeft / totalTime));
  const range = GAME_CONFIG.MAX_GUESS_SCORE - GAME_CONFIG.MIN_GUESS_SCORE;
  return Math.round(GAME_CONFIG.MIN_GUESS_SCORE + range * ratio);
}

/**
 * Calculate drawer score based on number of correct guessers.
 */
export function calculateDrawerScore(numGuessers: number): number {
  if (numGuessers === 0) return 0;
  return GAME_CONFIG.DRAWER_BASE_SCORE + (numGuessers * GAME_CONFIG.DRAWER_PER_GUESS_BONUS);
}

/**
 * Calculate streak bonus for consecutive correct guesses.
 */
export function calculateStreakBonus(streak: number): number {
  if (streak <= 1) return 0;
  return (streak - 1) * GAME_CONFIG.STREAK_BONUS;
}
