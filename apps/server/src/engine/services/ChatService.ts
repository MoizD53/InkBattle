export class ChatService {
  checkGuess(guess: string, word: string): { isExactMatch: boolean; isCloseMatch: boolean } {
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = word.trim().toLowerCase();

    if (normalizedGuess === normalizedWord) {
      return { isExactMatch: true, isCloseMatch: false };
    }

    if (this.levenshteinDistance(normalizedGuess, normalizedWord) <= 1) {
      return { isExactMatch: false, isCloseMatch: true };
    }

    return { isExactMatch: false, isCloseMatch: false };
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,      // deletion
          matrix[i]![j - 1]! + 1,      // insertion
          matrix[i - 1]![j - 1]! + cost // substitution
        );
      }
    }

    return matrix[a.length]![b.length]!;
  }
}
