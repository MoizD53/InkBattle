// ─── Drawing Types ────────────────────────────────────────────

export type DrawingTool =
  | 'brush'
  | 'pencil'
  | 'marker'
  | 'eraser'
  | 'bucket'
  | 'line'
  | 'rect'
  | 'circle'
  | 'triangle';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number;
  opacity: number;
  points: number[]; // flat array [x1,y1,x2,y2,...] for compression
}

export interface DrawingAction {
  type: 'stroke' | 'stroke_progress' | 'stroke_end' | 'fill' | 'clear' | 'undo' | 'redo';
  stroke?: Stroke;
  fillColor?: string;
  fillPoint?: Point;
}

/** Compressed drawing data sent over socket */
export interface DrawingBatch {
  actions: DrawingAction[];
  timestamp: number;
}

/** Canvas state snapshot for late joiners */
export interface CanvasSnapshot {
  strokes: Stroke[];
  width: number;
  height: number;
}
