import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  GameState,
  GamePhase,
  RoundResult,
  GuesserResult,
  GameResult,
  RoomSettings,
  RoomPlayer,
  DrawingAction,
  CanvasSnapshot,
} from '@scribble/shared';
import { GAME_CONFIG } from '@scribble/shared';
import { calculateGuessScore, calculateDrawerScore, calculateStreakBonus } from '../utils/scoring.js';

import { PlayerService } from './services/PlayerService.js';
import { TurnManager } from './services/TurnManager.js';
import { TimerService } from './services/TimerService.js';
import { CanvasService } from './services/CanvasService.js';
import { ChatService } from './services/ChatService.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class GameRoom {
  public readonly roomId: string;
  public readonly roomCode: string;

  private io: TypedIO;
  private settings: RoomSettings;
  
  private phase: GamePhase = 'waiting';
  private correctGuessers: string[] = [];
  
  private roundResults: RoundResult[] = [];
  private roundGuessers: GuesserResult[] = [];

  private playerService: PlayerService;
  private turnManager: TurnManager;
  private timerService: TimerService;
  private canvasService: CanvasService;
  private chatService: ChatService;

  constructor(
    io: TypedIO,
    roomId: string,
    roomCode: string,
    initialHostId: string,
    settings: RoomSettings,
  ) {
    this.io = io;
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.settings = { ...settings };

    this.playerService = new PlayerService(roomId, roomCode, initialHostId);
    this.turnManager = new TurnManager();
    this.timerService = new TimerService();
    this.canvasService = new CanvasService();
    this.chatService = new ChatService();

    console.log(`[GameRoom] Created for room ${roomCode} (${roomId})`);
  }

  get hostId(): string {
    return this.playerService.hostId;
  }

  // ─── Player Management ──────────────────────────────────────

  addPlayer(player: RoomPlayer): void {
    const { isReconnected } = this.playerService.addPlayer(player);
    if (!isReconnected && this.phase !== 'waiting' && this.phase !== 'finished') {
      this.turnManager.addPlayerToQueue(player.id);
    }
    this.broadcastState();
  }

  removePlayer(playerId: string): boolean {
    const { allOffline } = this.playerService.removePlayer(playerId);

    if (this.phase === 'drawing' && this.turnManager.getCurrentDrawerId() === playerId) {
      console.log(`[GameRoom] Drawer left, skipping to reveal`);
      this.timerService.clearTimers();
      this.transitionToReveal();
    }

    if (allOffline) {
      console.log(`[GameRoom] All players offline, ending game`);
      this.endGame();
      return true; // signal room can be cleaned up
    }

    this.broadcastState();
    return false;
  }

  // ─── Settings ───────────────────────────────────────────────

  updateSettings(settings: Partial<RoomSettings>): void {
    if (this.phase !== 'waiting') return;
    this.settings = { ...this.settings, ...settings };
    console.log(`[GameRoom] Settings updated for room ${this.roomCode}`);
  }

  getSettings(): RoomSettings {
    return { ...this.settings };
  }

  // ─── Game Flow ──────────────────────────────────────────────

  startGame(): boolean {
    const onlinePlayers = this.playerService.getOnlinePlayers();
    if (onlinePlayers.length < GAME_CONFIG.MIN_PLAYERS) {
      return false;
    }

    if (this.phase !== 'waiting') return false;

    this.playerService.resetForNewGame();
    this.turnManager.startNewGame(onlinePlayers.map(p => p.id));
    this.roundResults = [];

    this.transitionToStarting();
    return true;
  }

  private transitionToStarting(): void {
    this.phase = 'starting';
    this.broadcastState();

    this.timerService.startCountdown(
      GAME_CONFIG.COUNTDOWN_SECONDS,
      (timeLeft) => {
        this.io.to(this.roomId).emit('game:countdown', timeLeft);
      },
      () => {
        this.transitionToSelecting();
      }
    );
  }

  private transitionToSelecting(): void {
    this.phase = 'selecting';
    this.correctGuessers = [];
    this.roundGuessers = [];
    this.canvasService.clearCanvas();
    this.io.to(this.roomId).emit('draw:clear');
    this.playerService.resetForNewRound();

    const drawerId = this.turnManager.getCurrentDrawerId();
    if (!drawerId) {
      this.endGame();
      return;
    }

    const drawer = this.playerService.getPlayer(drawerId);
    if (!drawer || !drawer.isOnline) {
      const { isGameOver } = this.turnManager.nextTurn(this.settings.rounds);
      if (isGameOver) {
        this.endGame();
      } else {
        this.transitionToSelecting();
      }
      return;
    }

    drawer.isDrawing = true;
    const choices = this.turnManager.generateWordChoices(this.settings.wordDifficulty);
    this.broadcastState();

    const drawerSockets = this.io.in(this.roomId).fetchSockets();
    drawerSockets.then((sockets) => {
      for (const socket of sockets) {
        if (socket.data.userId === drawerId) {
          socket.emit('game:wordChoices', choices);
          break;
        }
      }
    });

    this.timerService.setPhaseTimeout(15_000, () => {
      if (this.phase === 'selecting' && choices.length > 0) {
        this.selectWord(choices[0]!);
      }
    });
  }

  selectWord(word: string): void {
    if (this.phase !== 'selecting') return;
    this.turnManager.selectWord(word);
    this.transitionToDrawing();
  }

  private transitionToDrawing(): void {
    this.phase = 'drawing';
    this.broadcastState();
    this.io.to(this.roomId).emit('game:hint', this.turnManager.getCurrentHint());
    this.io.to(this.roomId).emit('draw:clear');

    let hintStage = 0;
    
    this.timerService.startDrawingTimer(
      this.settings.drawTime,
      (timeLeft, totalTime) => {
        if (this.settings.hintsEnabled) {
          const elapsed = totalTime - timeLeft;
          const elapsedPercent = elapsed / totalTime;

          if (elapsedPercent >= GAME_CONFIG.FIRST_HINT_PERCENT) {
            const newHintStage = Math.floor(
              (elapsedPercent - GAME_CONFIG.FIRST_HINT_PERCENT) / GAME_CONFIG.HINT_INTERVAL_PERCENT
            ) + 1;

            if (newHintStage > hintStage) {
              hintStage = newHintStage;
              this.turnManager.updateHint(hintStage);
              this.io.to(this.roomId).emit('game:hint', this.turnManager.getCurrentHint());
            }
          }
        }
        // Broadcast every second
        this.broadcastState();
      },
      () => {
        this.transitionToReveal();
      }
    );
  }

  private transitionToReveal(): void {
    this.phase = 'reveal';

    const drawerId = this.turnManager.getCurrentDrawerId();
    const drawerScore = calculateDrawerScore(this.correctGuessers.length);
    if (drawerId && drawerScore > 0) {
      const drawer = this.playerService.getPlayer(drawerId);
      if (drawer) drawer.score += drawerScore;
    }

    const roundResult: RoundResult = {
      round: this.turnManager.getCurrentRound(),
      word: this.turnManager.getCurrentWord() ?? '???',
      drawerId: drawerId ?? '',
      drawerScore,
      guessers: [...this.roundGuessers],
      timeElapsed: this.timerService.getElapsedRoundTime(),
    };
    this.roundResults.push(roundResult);

    this.broadcastState();
    this.io.to(this.roomId).emit('game:roundResult', roundResult);
    this.io.to(this.roomId).emit('game:scoreUpdate', this.getScores());

    this.timerService.setPhaseTimeout(GAME_CONFIG.REVEAL_DURATION * 1000, () => {
      this.transitionToScoring();
    });
  }

  private transitionToScoring(): void {
    this.phase = 'scoring';
    this.broadcastState();

    this.timerService.setPhaseTimeout(GAME_CONFIG.SCORING_DURATION * 1000, () => {
      const { isGameOver } = this.turnManager.nextTurn(this.settings.rounds);
      if (isGameOver) {
        this.endGame();
      } else {
        this.transitionToSelecting();
      }
    });
  }

  private endGame(): void {
    this.phase = 'finished';
    this.timerService.clearTimers();

    const result = this.buildGameResult();
    this.io.to(this.roomId).emit('game:finished', result);
    this.broadcastState();

    this.timerService.setPhaseTimeout(10_000, () => {
      this.phase = 'waiting';
      this.playerService.resetForNewRound();
      this.broadcastState();
    });
  }

  // ─── Guessing ───────────────────────────────────────────────

  handleGuess(playerId: string, guess: string): { correct: boolean; close: boolean } {
    if (this.phase !== 'drawing') return { correct: false, close: false };
    
    const word = this.turnManager.getCurrentWord();
    if (!word) return { correct: false, close: false };
    if (playerId === this.turnManager.getCurrentDrawerId()) return { correct: false, close: false };

    const player = this.playerService.getPlayer(playerId);
    if (!player || player.hasGuessed) return { correct: false, close: false };

    const result = this.chatService.checkGuess(guess, word);

    if (result.isExactMatch) {
      player.hasGuessed = true;
      player.streak++;
      this.correctGuessers.push(playerId);

      const baseScore = calculateGuessScore(this.timerService.getTimeLeft(), this.timerService.getTotalTime());
      const streakBonus = calculateStreakBonus(player.streak);
      const totalScore = baseScore + streakBonus;

      player.score += totalScore;
      this.roundGuessers.push({
        playerId: player.id,
        username: player.username,
        timeToGuess: this.timerService.getElapsedRoundTime(),
        score: totalScore,
      });

      this.io.to(this.roomId).emit('game:correctGuess', playerId, player.username);
      this.io.to(this.roomId).emit('game:scoreUpdate', this.getScores());

      const onlinePlayers = this.playerService.getOnlinePlayers();
      const allGuessed = onlinePlayers
        .filter(p => p.id !== this.turnManager.getCurrentDrawerId())
        .every(p => p.hasGuessed);

      if (allGuessed) {
        this.timerService.clearTimers();
        this.transitionToReveal();
      }

      this.broadcastState();
      return { correct: true, close: false };
    }

    if (result.isCloseMatch) {
      this.io.to(this.roomId).emit('game:closeGuess', playerId);
      return { correct: false, close: true };
    }

    player.streak = 0;
    return { correct: false, close: false };
  }

  // ─── Drawing Relay ──────────────────────────────────────────

  relayDrawAction(senderId: string, action: DrawingAction): void {
    if (this.phase !== 'drawing') return;
    if (senderId !== this.turnManager.getCurrentDrawerId()) return;

    this.canvasService.addAction(action);
    const sockets = this.io.in(this.roomId);
    sockets.fetchSockets().then((socketList) => {
      for (const socket of socketList) {
        if (socket.data.userId !== senderId) {
          socket.emit('draw:action', action);
        }
      }
    });
  }

  relayDrawBatch(senderId: string, actions: DrawingAction[]): void {
    if (this.phase !== 'drawing') return;
    if (senderId !== this.turnManager.getCurrentDrawerId()) return;

    this.canvasService.addBatch(actions);
    const sockets = this.io.in(this.roomId);
    sockets.fetchSockets().then((socketList) => {
      for (const socket of socketList) {
        if (socket.data.userId !== senderId) {
          socket.emit('draw:batch', actions);
        }
      }
    });
  }

  setCanvasSnapshot(snapshot: CanvasSnapshot): void {
    this.canvasService.setSnapshot(snapshot);
  }

  getCanvasSnapshot(): CanvasSnapshot | null {
    return this.canvasService.getSnapshot();
  }

  getCurrentDrawerId(): string | null {
    return this.turnManager.getCurrentDrawerId();
  }

  // ─── State Broadcasting ─────────────────────────────────────

  getPhase(): GamePhase {
    return this.phase;
  }

  getState(): GameState {
    return {
      phase: this.phase,
      currentRound: this.turnManager.getCurrentRound(),
      totalRounds: this.settings.rounds,
      currentDrawerId: this.turnManager.getCurrentDrawerId(),
      word: this.phase === 'reveal' || this.phase === 'scoring' ? this.turnManager.getCurrentWord() : null,
      hint: this.turnManager.getCurrentHint(),
      timeLeft: this.timerService.getTimeLeft(),
      totalTime: this.timerService.getTotalTime(),
      players: this.playerService.getAllPlayers(),
      correctGuessers: [...this.correctGuessers],
      scores: this.getScores(),
    };
  }

  private getScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const player of this.playerService.getAllPlayers()) {
      scores[player.id] = player.score;
    }
    return scores;
  }

  private broadcastState(): void {
    const state: GameState = {
      phase: this.phase,
      currentRound: this.turnManager.getCurrentRound(),
      totalRounds: this.settings.rounds,
      currentDrawerId: this.turnManager.getCurrentDrawerId(),
      word: this.phase === 'reveal' || this.phase === 'scoring' ? this.turnManager.getCurrentWord() : null,
      hint: this.turnManager.getCurrentHint(),
      timeLeft: this.timerService.getTimeLeft(),
      totalTime: this.timerService.getTotalTime(),
      players: this.playerService.getAllPlayers(),
      correctGuessers: [...this.correctGuessers],
      scores: this.getScores(),
    };
    this.io.to(this.roomId).emit('game:state', state);
  }

  private buildGameResult(): GameResult {
    const playersArray = this.playerService.getAllPlayers()
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        totalScore: p.score,
        rank: index + 1,
        correctGuesses: this.roundResults.reduce(
          (count, r) => count + r.guessers.filter((g) => g.playerId === p.id).length,
          0
        ),
        drawingScore: this.roundResults.reduce(
          (score, r) => score + (r.drawerId === p.id ? r.drawerScore : 0),
          0
        ),
      }));

    return {
      winnerId: playersArray[0]?.id ?? '',
      players: playersArray,
      totalRounds: this.turnManager.getCurrentRound(),
      duration: this.timerService.getRoundDurationMs(),
    };
  }

  destroy(): void {
    this.timerService.clearTimers();
    console.log(`[GameRoom] Destroyed room ${this.roomCode}`);
  }
}
