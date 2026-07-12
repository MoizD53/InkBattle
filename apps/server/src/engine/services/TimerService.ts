export class TimerService {
  private gameTimer: ReturnType<typeof setInterval> | null = null;
  private phaseTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private timeLeft: number = 0;
  private totalTime: number = 0;
  private roundStartTime: number = 0;

  startCountdown(seconds: number, onTick: (timeLeft: number) => void, onComplete: () => void): void {
    this.clearTimers();
    let countdown = seconds;
    onTick(countdown);

    this.gameTimer = setInterval(() => {
      countdown--;
      onTick(countdown);
      if (countdown <= 0) {
        this.clearTimers();
        onComplete();
      }
    }, 1000);
  }

  startDrawingTimer(totalTime: number, onTick: (timeLeft: number, totalTime: number) => void, onComplete: () => void): void {
    this.clearTimers();
    this.totalTime = totalTime;
    this.timeLeft = totalTime;
    this.roundStartTime = Date.now();

    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      onTick(this.timeLeft, this.totalTime);
      if (this.timeLeft <= 0) {
        this.clearTimers();
        onComplete();
      }
    }, 1000);
  }

  setPhaseTimeout(delayMs: number, callback: () => void): void {
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(callback, delayMs);
  }

  getTimeLeft(): number {
    return this.timeLeft;
  }

  getTotalTime(): number {
    return this.totalTime;
  }

  getElapsedRoundTime(): number {
    return this.totalTime - this.timeLeft;
  }

  getRoundDurationMs(): number {
    return Date.now() - this.roundStartTime;
  }

  clearTimers(): void {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
  }
}
