import { create } from 'zustand';
import type { GameState, RoundResult, GameResult, ChatMessage } from '@scribble/shared';

interface GameStore {
  gameState: GameState | null;
  chatMessages: ChatMessage[];
  wordChoices: string[];
  lastRoundResult: RoundResult | null;
  gameResult: GameResult | null;
  countdown: number | null;
  
  // Actions to mutate state
  setGameState: (state: GameState) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setWordChoices: (choices: string[]) => void;
  setCountdown: (seconds: number | null) => void;
  setRoundResult: (result: RoundResult) => void;
  setGameResult: (result: GameResult) => void;
  clearState: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  chatMessages: [],
  wordChoices: [],
  lastRoundResult: null,
  gameResult: null,
  countdown: null,

  setGameState: (state) => set({ gameState: state }),
  
  addChatMessage: (msg) => set((state) => ({ 
    chatMessages: [...state.chatMessages, msg] 
  })),

  setWordChoices: (choices) => set({ wordChoices: choices }),
  
  setCountdown: (seconds) => set({ countdown: seconds }),
  
  setRoundResult: (result) => set({ lastRoundResult: result }),
  
  setGameResult: (result) => set({ gameResult: result }),

  clearState: () => set({
    gameState: null,
    chatMessages: [],
    wordChoices: [],
    lastRoundResult: null,
    gameResult: null,
    countdown: null,
  })
}));
