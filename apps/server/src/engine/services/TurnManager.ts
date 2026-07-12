import { GAME_CONFIG, getRandomWords } from '@scribble/shared';

export class TurnManager {
  private drawerOrder: string[] = [];
  private drawerIndex: number = 0;
  private currentRound: number = 0;
  private wordChoices: string[] = [];
  private currentWord: string | null = null;
  private currentHint: string = '';

  startNewGame(onlinePlayerIds: string[]): void {
    this.drawerOrder = [...onlinePlayerIds];
    this.shuffleArray(this.drawerOrder);
    this.drawerIndex = 0;
    this.currentRound = 1;
    this.wordChoices = [];
    this.currentWord = null;
    this.currentHint = '';
  }

  addPlayerToQueue(playerId: string): void {
    if (!this.drawerOrder.includes(playerId)) {
      this.drawerOrder.push(playerId);
    }
  }

  getCurrentDrawerId(): string | null {
    if (this.drawerOrder.length === 0) return null;
    return this.drawerOrder[this.drawerIndex % this.drawerOrder.length] ?? null;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  generateWordChoices(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): string[] {
    this.wordChoices = getRandomWords(difficulty, GAME_CONFIG.WORD_CHOICES);
    return this.wordChoices;
  }

  getWordChoices(): string[] {
    return this.wordChoices;
  }

  selectWord(word: string): void {
    this.currentWord = word;
    this.currentHint = this.generateInitialHint(word);
  }

  getCurrentWord(): string | null {
    return this.currentWord;
  }

  getCurrentHint(): string {
    return this.currentHint;
  }

  updateHint(hintStage: number): void {
    if (!this.currentWord) return;
    this.currentHint = this.generateHintFromStage(this.currentWord, hintStage);
  }

  nextTurn(totalRounds: number): { isGameOver: boolean } {
    this.drawerIndex++;

    if (this.drawerIndex >= this.drawerOrder.length) {
      this.drawerIndex = 0;
      this.currentRound++;

      if (this.currentRound > totalRounds) {
        return { isGameOver: true };
      }

      this.shuffleArray(this.drawerOrder);
    }
    
    return { isGameOver: false };
  }

  private generateInitialHint(word: string): string {
    return word
      .split('')
      .map((ch) => (ch === ' ' ? '  ' : '_ '))
      .join('')
      .trim();
  }

  private generateHintFromStage(word: string, revealCount: number): string {
    if (revealCount === 0) return this.generateInitialHint(word);

    const letters = word.split('');
    const revealable: number[] = [];

    letters.forEach((ch, i) => {
      if (ch !== ' ') revealable.push(i);
    });

    const toReveal = new Set<number>();
    const actualRevealCount = Math.min(revealCount, revealable.length - 1);

    for (let i = 0; i < actualRevealCount && i < revealable.length; i++) {
      const idx = Math.floor((i * revealable.length) / actualRevealCount);
      const revealIdx = revealable[idx];
      if (revealIdx !== undefined) {
        toReveal.add(revealIdx);
      }
    }

    return letters
      .map((ch, i) => {
        if (ch === ' ') return '  ';
        if (toReveal.has(i)) return ch + ' ';
        return '_ ';
      })
      .join('')
      .trim();
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j]!, array[i]!];
    }
  }
}
