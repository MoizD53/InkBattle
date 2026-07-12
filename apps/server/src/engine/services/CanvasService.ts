import type { CanvasSnapshot, DrawingAction } from '@scribble/shared';

export class CanvasService {
  private canvasSnapshot: CanvasSnapshot | null = null;
  private drawingActions: DrawingAction[] = [];

  clearCanvas(): void {
    this.canvasSnapshot = null;
    this.drawingActions = [];
  }

  setSnapshot(snapshot: CanvasSnapshot): void {
    this.canvasSnapshot = snapshot;
  }

  getSnapshot(): CanvasSnapshot | null {
    return this.canvasSnapshot;
  }

  addAction(action: DrawingAction): void {
    this.drawingActions.push(action);
  }

  addBatch(actions: DrawingAction[]): void {
    this.drawingActions.push(...actions);
  }

  getActions(): DrawingAction[] {
    return [...this.drawingActions];
  }
}
