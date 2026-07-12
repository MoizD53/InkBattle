import { useEffect, useRef, useCallback, useState } from 'react';
import { DrawingEngine } from './DrawingEngine';
import { useDrawingStore } from '../../stores/drawingStore';
import { useSocketStore } from '../../stores/socketStore';

export function DrawingCanvas({ 
  isDrawer, 
  onStrokeAction,
  onEngineReady
}: { 
  isDrawer: boolean;
  onStrokeAction?: (action: any) => void;
  onEngineReady?: (engine: DrawingEngine) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);

  const { tool, color, brushSize } = useDrawingStore();
  const { socket } = useSocketStore();

  // Initialize engine
  useEffect(() => {
    if (!bgCanvasRef.current || !activeCanvasRef.current) return;

    engineRef.current = new DrawingEngine(
      bgCanvasRef.current,
      activeCanvasRef.current,
      {
        onStrokeProgress: (strokeId, tool, color, size, newPoints) => {
          if (isDrawer) {
            const action = {
              type: 'stroke_progress' as const,
              stroke: { id: strokeId, tool, color, size, opacity: 1, points: newPoints }
            };
            socket?.emit('draw:action', action);
            onStrokeAction?.(action);
          }
        },
        onStrokeEnd: (strokeId) => {
          if (isDrawer) {
            const action = {
              type: 'stroke_end' as const,
              stroke: { id: strokeId, tool: 'brush' as const, color: '', size: 0, opacity: 1, points: [] }
            };
            socket?.emit('draw:action', action);
            onStrokeAction?.(action);
          }
        },
        onClear: () => {
          if (isDrawer) {
            socket?.emit('draw:action', { type: 'clear' });
          }
        }
      }
    );

    if (engineRef.current) {
      onEngineReady?.(engineRef.current);
    }

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [isDrawer, onStrokeAction, socket, onEngineReady]);

  // Sync tool state to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTool(tool);
      engineRef.current.setColor(color);
      engineRef.current.setSize(brushSize);
    }
  }, [tool, color, brushSize]);

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        engineRef.current?.resize(width, height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle Socket Events (receiving strokes)
  useEffect(() => {
    if (!socket) return;

    const handleDrawAction = (action: any) => {
      if (isDrawer) return;
      engineRef.current?.applyRemoteAction(action);
    };

    const handleDrawBatch = (batch: any[]) => {
      if (isDrawer) return;
      batch.forEach(action => engineRef.current?.applyRemoteAction(action));
    };

    const handleClear = () => {
      engineRef.current?.applyRemoteAction({ type: 'clear' });
    };

    socket.on('draw:action', handleDrawAction);
    socket.on('draw:batch', handleDrawBatch);
    socket.on('draw:clear', handleClear);

    return () => {
      socket.off('draw:action', handleDrawAction);
      socket.off('draw:batch', handleDrawBatch);
      socket.off('draw:clear', handleClear);
    };
  }, [socket, isDrawer]);

  // Pointer event handlers
  // Using pure DOM events instead of React synthetic events could be marginally faster, 
  // but React 19 synthetic events are extremely close to native.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    // Reject multi-touch to prevent palm interference or accidental two-finger drawing
    if (!e.isPrimary) return;
    
    activeCanvasRef.current?.setPointerCapture(e.pointerId);
    
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== 0 ? e.pressure : 0.5;
    
    engineRef.current?.handlePointerDown(x, y, pressure);
  }, [isDrawer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    if (!e.isPrimary) return;
    // Only capture if active
    if (!activeCanvasRef.current?.hasPointerCapture(e.pointerId)) return;
    
    // Attempt to process coalesced events for higher fidelity (Apple Pencil/120Hz displays)
    const events = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [e.nativeEvent];
    const rect = activeCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    for (const event of events) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pressure = (event as PointerEvent).pressure !== 0 ? (event as PointerEvent).pressure : 0.5;
      engineRef.current?.handlePointerMove(x, y, pressure);
    }
  }, [isDrawer]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    activeCanvasRef.current?.releasePointerCapture(e.pointerId);
    engineRef.current?.handlePointerUp();
  }, [isDrawer]);

  // Dynamic Cursor
  const [cursorUrl, setCursorUrl] = useState('');

  useEffect(() => {
    if (tool === 'bucket') {
      const bucketSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="M5 2l5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>`;
      setCursorUrl(`url("data:image/svg+xml;base64,${btoa(bucketSvg)}") 4 20, crosshair`);
    } else {
      const s = Math.max(4, brushSize);
      const circleSvg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s/2}" cy="${s/2}" r="${(s/2)-0.5}" fill="none" stroke="black" stroke-width="1"/><circle cx="${s/2}" cy="${s/2}" r="${(s/2)-1.5}" fill="none" stroke="white" stroke-width="1"/></svg>`;
      setCursorUrl(`url("data:image/svg+xml;base64,${btoa(circleSvg)}") ${s/2} ${s/2}, crosshair`);
    }
  }, [tool, brushSize]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-white touch-none rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800"
      style={{ cursor: cursorUrl }}
    >
      <canvas 
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      <canvas 
        ref={activeCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
