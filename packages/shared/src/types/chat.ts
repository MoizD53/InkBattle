// ─── Chat Types ───────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'message' | 'guess' | 'correct' | 'close' | 'system' | 'join' | 'leave';
  timestamp: number;
}
