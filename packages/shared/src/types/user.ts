// ─── User Types ───────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  level: number;
  xp: number;
  wins: number;
  gamesPlayed: number;
  totalScore: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GuestLoginRequest {
  username: string;
}
