import type { DrawingTool, Point, Stroke, DrawingAction, CanvasSnapshot } from '@scribble/shared';
import { BRUSH_SIZES } from '@scribble/shared';

type EngineCallback = {
  onStrokeProgress: (strokeId: string, tool: DrawingTool, color: string, size: number, newPoints: number[]) => void;
  onStrokeEnd: (strokeId: string) => void;
  onClear: () => void;
};

export class DrawingEngine {
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContextCurrent;
  private activeCanvas: HTMLCanvasElement;
  private activeCtx: CanvasRenderingContextCurrent;
  
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  // State
  private tool: DrawingTool = 'brush';
  private color: string = '#000000';
  private size: number = BRUSH_SIZES[1];
  
  // Drawing state
  private isDrawing: boolean = false;
  private currentPoints: Point[] = [];
  private currentStrokeId: string = '';
  private unemittedPoints: number[] = [];
  private lastEmitTime: number = 0;
  private EMIT_INTERVAL = 30; // 30ms batching window
  
  private strokes: Stroke[] = [];
  private redoStack: Stroke[] = [];
  private remoteStrokes: Map<string, Stroke> = new Map();

  // Performance
  private rAF: number | null = null;
  private needsRedraw: boolean = false;
  
  // Callbacks
  private callbacks: EngineCallback;

  // Offscreen rendering
  private offscreenCanvas: HTMLCanvasElement | OffscreenCanvas;
  private offscreenCtx: CanvasRenderingContextCurrent;

  constructor(
    bgCanvas: HTMLCanvasElement, 
    activeCanvas: HTMLCanvasElement,
    callbacks: EngineCallback
  ) {
    this.bgCanvas = bgCanvas;
    this.activeCanvas = activeCanvas;
    this.callbacks = callbacks;
    
    // Attempt OffscreenCanvas for background if supported
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(300, 150);
    } else {
      this.offscreenCanvas = document.createElement('canvas');
    }
    
    const bgCtx = bgCanvas.getContext('2d', { alpha: false, desynchronized: true });
    const activeCtx = activeCanvas.getContext('2d', { desynchronized: true });
    const offCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
    
    if (!bgCtx || !activeCtx || !offCtx) throw new Error('Canvas 2D context not supported');
    
    this.bgCtx = bgCtx as CanvasRenderingContextCurrent;
    this.activeCtx = activeCtx as CanvasRenderingContextCurrent;
    this.offscreenCtx = offCtx as CanvasRenderingContextCurrent;

    this.startRenderLoop();
  }

  // ─── Initialization & Resize ─────────────────────────────────

  public resize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    
    this.dpr = window.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    
    const w = Math.floor(width * this.dpr);
    const h = Math.floor(height * this.dpr);

    // Resize active canvas (clears it)
    this.activeCanvas.width = w;
    this.activeCanvas.height = h;
    this.activeCanvas.style.width = `${width}px`;
    this.activeCanvas.style.height = `${height}px`;
    this.activeCtx.scale(this.dpr, this.dpr);

    // Resize bg and offscreen (clears them)
    this.bgCanvas.width = w;
    this.bgCanvas.height = h;
    this.bgCanvas.style.width = `${width}px`;
    this.bgCanvas.style.height = `${height}px`;
    this.bgCtx.scale(this.dpr, this.dpr);

    this.offscreenCanvas.width = w;
    this.offscreenCanvas.height = h;
    this.offscreenCtx.scale(this.dpr, this.dpr);
    
    // Repaint all committed strokes
    this.redrawBackground();
  }

  // ─── Input Handling ──────────────────────────────────────────

  public handlePointerDown(x: number, y: number, pressure: number = 0.5): void {
    if (this.tool === 'bucket') {
      this.floodFill(Math.round(x), Math.round(y), this.color);
      return;
    }

    this.isDrawing = true;
    this.currentStrokeId = Math.random().toString(36).substring(7);
    this.currentPoints = [{ x, y, pressure }];
    this.unemittedPoints = [Math.round(x), Math.round(y), pressure];
    this.needsRedraw = true;
    
    this.emitProgress(); // Emit initial point immediately
  }

  public handlePointerMove(x: number, y: number, pressure: number = 0.5): void {
    if (!this.isDrawing) return;
    
    this.currentPoints.push({ x, y, pressure });
    this.unemittedPoints.push(Math.round(x), Math.round(y), pressure);
    this.needsRedraw = true;
  }

  public handlePointerUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    
    if (this.currentPoints.length > 0) {
      this.commitStroke();
    }
  }

  public setTool(tool: DrawingTool) { this.tool = tool; }
  public setColor(color: string) { this.color = color; }
  public setSize(size: number) { this.size = size; }

  // ─── Rendering Loop ──────────────────────────────────────────

  private startRenderLoop = () => {
    this.rAF = requestAnimationFrame(this.startRenderLoop);
    
    if (this.needsRedraw) {
      this.renderActiveLayer();
      this.needsRedraw = false;
    }

    // Batch emit
    if (this.isDrawing && this.unemittedPoints.length > 0) {
      const now = Date.now();
      if (now - this.lastEmitTime > this.EMIT_INTERVAL) {
        this.emitProgress();
      }
    }
  }

  private emitProgress(): void {
    if (this.unemittedPoints.length === 0) return;
    
    this.callbacks.onStrokeProgress(
      this.currentStrokeId,
      this.tool,
      this.color,
      this.size,
      [...this.unemittedPoints]
    );
    
    this.unemittedPoints = [];
    this.lastEmitTime = Date.now();
  }

  private renderActiveLayer(): void {
    const ctx = this.activeCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentPoints.length === 0) return;

    if (this.tool === 'eraser') {
      // For live eraser preview, we draw the entire background again, 
      // but punch a hole using destination-out directly on the active stroke.
      this.copyOffscreenToBg();
      this.bgCtx.globalCompositeOperation = 'destination-out';
      this.bgCtx.lineWidth = this.size;
      this.bgCtx.lineCap = 'round';
      this.bgCtx.lineJoin = 'round';
      this.bgCtx.strokeStyle = 'rgba(0,0,0,1)';
      this.drawSmoothCurve(this.bgCtx, this.currentPoints);
      this.bgCtx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.drawSmoothCurve(ctx, this.currentPoints);
    }
  }

  private drawSmoothCurve(ctx: CanvasRenderingContextCurrent, points: Point[]): void {
    if (points.length < 2) {
      const p = points[0];
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      
      if (p1.pressure !== undefined && p1.pressure !== 0.5) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineWidth = this.size * (p1.pressure * 1.5);
      }
      
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    }
    
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  private commitStroke(): void {
    if (this.currentPoints.length === 0) return;

    // Emit any remaining points
    this.emitProgress();
    
    // Emit end
    this.callbacks.onStrokeEnd(this.currentStrokeId);

    const flatPoints: number[] = [];
    for (const p of this.currentPoints) {
      flatPoints.push(Math.round(p.x), Math.round(p.y), p.pressure ?? 0.5);
    }

    const stroke: Stroke = {
      id: this.currentStrokeId,
      tool: this.tool,
      color: this.color,
      size: this.size,
      opacity: 1,
      points: flatPoints
    };

    this.strokes.push(stroke);
    this.redoStack = [];
    
    this.drawStrokeToOffscreen(stroke);
    this.copyOffscreenToBg();
    
    this.activeCtx.clearRect(0, 0, this.width, this.height);
    this.currentPoints = [];
    this.currentStrokeId = '';
  }

  private drawStrokeToOffscreen(stroke: Stroke): void {
    if (stroke.tool === 'bucket') {
      this.floodFillInternal(stroke.points[0], stroke.points[1], stroke.color);
      return;
    }

    const ctx = this.offscreenCtx;
    
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }
    
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points: Point[] = [];
    for (let i = 0; i < stroke.points.length; i += 3) {
      points.push({
        x: stroke.points[i],
        y: stroke.points[i+1],
        pressure: stroke.points[i+2]
      });
    }

    this.drawSmoothCurve(ctx, points);
  }

  // Draw a specific segment of a remote stroke (dirty rectangle optimization)
  private drawPartialStrokeToOffscreen(stroke: Stroke): void {
    const ctx = this.offscreenCtx;
    
    if (stroke.tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.strokeStyle = stroke.color;
    }
    
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // We need at least the last point of the existing stroke to connect the new segment seamlessly.
    // For simplicity and correctness with bezier curves, if the stroke is short, just redraw the whole thing.
    // If it's long, we should ideally redraw only the tail.
    // For now, redrawing the remote stroke efficiently on the active canvas might be better.
    // Wait, remote strokes should just be drawn to the OFFSCREEN canvas immediately as they come in.
    
    const points: Point[] = [];
    for (let i = 0; i < stroke.points.length; i += 3) {
      points.push({
        x: stroke.points[i],
        y: stroke.points[i+1],
        pressure: stroke.points[i+2]
      });
    }

    // Redraw the entire remote stroke on the offscreen canvas.
    // In a fully optimized dirty rect engine, we would clear only the bounding box of the old stroke,
    // or we just re-render the whole stroke over the background. But since it's progressive, 
    // redrawing the whole background is expensive. 
    // Let's just redraw the entire background for now, it's fast enough on modern devices for partial strokes.
    this.redrawBackground(); 
  }

  private copyOffscreenToBg(): void {
    this.bgCtx.clearRect(0, 0, this.width, this.height);
    this.bgCtx.fillStyle = '#ffffff';
    this.bgCtx.fillRect(0, 0, this.width, this.height);
    this.bgCtx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
  }

  private redrawBackground(): void {
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    for (const stroke of this.strokes) {
      this.drawStrokeToOffscreen(stroke);
    }
    for (const stroke of this.remoteStrokes.values()) {
      this.drawStrokeToOffscreen(stroke);
    }
    this.copyOffscreenToBg();
  }

  // ─── Actions ─────────────────────────────────────────────────

  public undo(): void {
    const stroke = this.strokes.pop();
    if (stroke) {
      this.redoStack.push(stroke);
      this.redrawBackground();
    }
  }

  public redo(): void {
    const stroke = this.redoStack.pop();
    if (stroke) {
      this.strokes.push(stroke);
      this.drawStrokeToOffscreen(stroke);
      this.copyOffscreenToBg();
    }
  }

  public clear(): void {
    this.strokes = [];
    this.redoStack = [];
    this.remoteStrokes.clear();
    this.isDrawing = false;
    this.currentPoints = [];
    this.currentStrokeId = '';
    this.unemittedPoints = [];
    this.activeCtx.clearRect(0, 0, this.width, this.height);
    this.redrawBackground();
    this.callbacks.onClear();
  }

  public applyRemoteAction(action: DrawingAction): void {
    if (action.type === 'clear') {
      this.strokes = [];
      this.redoStack = [];
      this.remoteStrokes.clear();
      this.isDrawing = false;
      this.currentPoints = [];
      this.currentStrokeId = '';
      this.unemittedPoints = [];
      this.activeCtx.clearRect(0, 0, this.width, this.height);
      this.redrawBackground();
    } else if (action.type === 'undo') {
      this.undo();
    } else if (action.type === 'redo') {
      this.redo();
    } else if (action.type === 'stroke' && action.stroke) {
      this.strokes.push(action.stroke);
      this.drawStrokeToOffscreen(action.stroke);
      this.copyOffscreenToBg();
    } else if (action.type === 'stroke_progress' && action.stroke) {
      let stroke = this.remoteStrokes.get(action.stroke.id);
      if (!stroke) {
        stroke = {
          id: action.stroke.id,
          tool: action.stroke.tool,
          color: action.stroke.color,
          size: action.stroke.size,
          opacity: action.stroke.opacity,
          points: []
        };
        this.remoteStrokes.set(stroke.id, stroke);
      }
      stroke.points.push(...action.stroke.points);
      this.drawPartialStrokeToOffscreen(stroke);
    } else if (action.type === 'stroke_end' && action.stroke) {
      const stroke = this.remoteStrokes.get(action.stroke.id);
      if (stroke) {
        this.strokes.push(stroke);
        this.remoteStrokes.delete(stroke.id);
      }
    }
  }

  public getSnapshot(): CanvasSnapshot {
    return {
      strokes: [...this.strokes],
      width: this.width,
      height: this.height
    };
  }

  public loadSnapshot(snapshot: CanvasSnapshot): void {
    this.strokes = [...snapshot.strokes];
    this.redoStack = [];
    this.remoteStrokes.clear();
    this.redrawBackground();
  }
  
  private floodFill(startX: number, startY: number, fillColor: string): void {
    const stroke: Stroke = {
      id: Math.random().toString(36).substring(7),
      tool: 'bucket',
      color: fillColor,
      size: 1,
      opacity: 1,
      points: [Math.round(startX), Math.round(startY)]
    };
    
    this.strokes.push(stroke);
    this.redoStack = [];
    
    this.floodFillInternal(stroke.points[0], stroke.points[1], stroke.color);
    this.copyOffscreenToBg();
    
    // Emit to network as stroke_end since it's an instantaneous action
    
    // Actually wait, stroke_end means it was in progress. We should just send type: 'stroke'
    // but the engine expects stroke_end to finalize remote strokes, or stroke to just add it.
    // Let's emit stroke directly. Wait, the callbacks expect onStrokeEnd?
    // Let's just use the existing onStrokeProgress + onStrokeEnd pattern for simplicity.
    this.callbacks.onStrokeProgress(stroke.id, stroke.tool, stroke.color, stroke.size, stroke.points);
    this.callbacks.onStrokeEnd(stroke.id);
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private floodFillInternal(startX: number, startY: number, fillColor: string): void {
    // Highly optimized Uint32Array based flood fill
    const canvasWidth = this.width;
    const canvasHeight = this.height;
    
    if (startX < 0 || startY < 0 || startX >= canvasWidth || startY >= canvasHeight) return;

    const ctx = this.offscreenCtx;
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data32 = new Uint32Array(imageData.data.buffer);
    
    const targetColorRGB = this.hexToRgb(fillColor);
    const fillPixel32 = (255 << 24) | (targetColorRGB[2] << 16) | (targetColorRGB[1] << 8) | targetColorRGB[0];

    const startIdx = startY * canvasWidth + startX;
    const startPixel32 = data32[startIdx];
    
    if (startPixel32 === fillPixel32) return; // Already same color

    // Extract start color channels to handle tolerance
    const sr = startPixel32 & 0xff;
    const sg = (startPixel32 >> 8) & 0xff;
    const sb = (startPixel32 >> 16) & 0xff;
    const sa = (startPixel32 >> 24) & 0xff;

    const tolerance = 30; // Color tolerance

    const colorMatch = (pixel32: number) => {
      const r = pixel32 & 0xff;
      const g = (pixel32 >> 8) & 0xff;
      const b = (pixel32 >> 16) & 0xff;
      const a = (pixel32 >> 24) & 0xff;
      
      // If filling transparent space, match transparency. If matching color, check RGB dist.
      if (sa === 0) {
        return a === 0;
      }
      
      return Math.abs(r - sr) <= tolerance && 
             Math.abs(g - sg) <= tolerance && 
             Math.abs(b - sb) <= tolerance && 
             Math.abs(a - sa) <= tolerance;
    };

    const pixelStack: number[] = [startX, startY];

    while (pixelStack.length > 0) {
      let y = pixelStack.pop() as number;
      let x = pixelStack.pop() as number;

      let idx = y * canvasWidth + x;
      while (y >= 0 && colorMatch(data32[idx])) {
        y--;
        idx -= canvasWidth;
      }
      
      y++;
      idx += canvasWidth;
      
      let reachLeft = false;
      let reachRight = false;

      while (y < canvasHeight && colorMatch(data32[idx])) {
        data32[idx] = fillPixel32;
        
        if (x > 0) {
          if (colorMatch(data32[idx - 1])) {
            if (!reachLeft) {
              pixelStack.push(x - 1, y);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }
        
        if (x < canvasWidth - 1) {
          if (colorMatch(data32[idx + 1])) {
            if (!reachRight) {
              pixelStack.push(x + 1, y);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }
        
        y++;
        idx += canvasWidth;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  public destroy(): void {
    if (this.rAF) cancelAnimationFrame(this.rAF);
  }
}

type CanvasRenderingContextCurrent = CanvasRenderingContext2D;
