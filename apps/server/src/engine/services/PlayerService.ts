import type { PlayerState, RoomPlayer } from '@scribble/shared';

export class PlayerService {
  private players: Map<string, PlayerState> = new Map();
  public hostId: string;
  private readonly roomId: string;
  private readonly roomCode: string;

  constructor(roomId: string, roomCode: string, initialHostId: string) {
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.hostId = initialHostId;
  }

  addPlayer(player: RoomPlayer): { isReconnected: boolean; playerState: PlayerState } {
    const existing = this.players.get(player.id);
    if (existing) {
      existing.isOnline = true;
      console.log(`[PlayerService] Player reconnected: ${player.username} (${player.id})`);
      return { isReconnected: true, playerState: existing };
    } else {
      const newState: PlayerState = {
        id: player.id,
        username: player.username,
        avatar: player.avatar,
        score: 0,
        isDrawing: false,
        hasGuessed: false,
        isOnline: true,
        streak: 0,
      };
      this.players.set(player.id, newState);
      console.log(`[PlayerService] Player joined: ${player.username} (${player.id})`);
      return { isReconnected: false, playerState: newState };
    }
  }

  removePlayer(playerId: string): { playerState: PlayerState | null; allOffline: boolean; wasHost: boolean } {
    const player = this.players.get(playerId);
    if (!player) return { playerState: null, allOffline: false, wasHost: false };

    player.isOnline = false;
    console.log(`[PlayerService] Player left: ${player.username} (${playerId})`);

    const onlinePlayers = this.getOnlinePlayers();
    const allOffline = onlinePlayers.length === 0;
    const wasHost = playerId === this.hostId;

    if (wasHost && !allOffline) {
      this.migrateHost();
    }

    return { playerState: player, allOffline, wasHost };
  }

  private migrateHost(): void {
    const onlinePlayers = this.getOnlinePlayers();
    if (onlinePlayers.length > 0) {
      this.hostId = onlinePlayers[0]!.id;
      console.log(`[PlayerService] Host migrated to ${onlinePlayers[0]!.username} (${this.hostId})`);
    }
  }

  getPlayer(playerId: string): PlayerState | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  getOnlinePlayers(): PlayerState[] {
    return this.getAllPlayers().filter((p) => p.isOnline);
  }

  getPlayerCount(): number {
    return this.getOnlinePlayers().length;
  }

  resetForNewRound(): void {
    for (const player of this.players.values()) {
      player.hasGuessed = false;
      player.isDrawing = false;
    }
  }

  resetForNewGame(): void {
    for (const player of this.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.hasGuessed = false;
      player.isDrawing = false;
    }
  }
}
