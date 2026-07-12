import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDrawingStore } from '../../stores/drawingStore';
import { useSocketStore } from '../../stores/socketStore';
import { DRAWING_COLORS, BRUSH_SIZES } from '@scribble/shared';
import { Pencil, Eraser, PaintBucket, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import type { DrawingTool } from '@scribble/shared';

export function DrawingToolbar({ isDrawer, engine }: { isDrawer: boolean, engine: any }) {
  const { tool, color, brushSize, setTool, setColor, setBrushSize } = useDrawingStore();

  useEffect(() => {
    if (!isDrawer) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            engine?.redo();
            useSocketStore.getState().socket?.emit('draw:action', { type: 'redo' });
          } else {
            engine?.undo();
            useSocketStore.getState().socket?.emit('draw:action', { type: 'undo' });
          }
          e.preventDefault();
        }
        if (e.key.toLowerCase() === 'y') {
          engine?.redo();
          useSocketStore.getState().socket?.emit('draw:action', { type: 'redo' });
          e.preventDefault();
        }
        return;
      }

      switch(e.key.toLowerCase()) {
        case 'b': setTool('brush'); break;
        case 'e': setTool('eraser'); break;
        case 'f': setTool('bucket'); break;
        case 'delete':
          engine?.clear();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, engine, setTool]);

  if (!isDrawer) return null;

  const tools: { id: DrawingTool; icon: any; label: string }[] = [
    { id: 'brush', icon: Pencil, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'bucket', icon: PaintBucket, label: 'Fill' },
  ];

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-2 lg:bottom-4 left-2 right-2 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto glass rounded-2xl shadow-2xl z-20 flex flex-col pointer-events-auto max-w-[calc(100vw-1rem)] lg:max-w-3xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto overflow-y-hidden scrollbar-hide w-full overscroll-contain">
        {/* Tools */}
        <div className="flex gap-2 shrink-0">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${tool === t.id ? 'bg-primary-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
              title={t.label}
            >
              <t.icon className="w-6 h-6" />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Colors */}
        <div className="flex gap-2 shrink-0 items-center">
          {DRAWING_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform shrink-0 ${color === c ? 'scale-125 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden ring-1 ring-slate-300 dark:ring-slate-700 hover:scale-110 transition-transform flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <span className="text-[10px] font-bold text-slate-500">+</span>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="absolute -inset-2 w-12 h-12 cursor-pointer p-0 border-0 opacity-0"
            />
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Brush Size */}
        <div className="flex gap-2 items-center shrink-0">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 ${brushSize === size ? 'bg-slate-200 dark:bg-slate-700 ring-2 ring-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <div 
                className="bg-slate-700 dark:bg-slate-300 rounded-full" 
                style={{ width: `${Math.max(4, size/2)}px`, height: `${Math.max(4, size/2)}px` }} 
              />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Actions */}
        <div className="flex gap-2 shrink-0 pr-2">
          <button 
            onClick={() => {
              engine?.undo();
              useSocketStore.getState().socket?.emit('draw:action', { type: 'undo' });
            }} 
            className="flex items-center justify-center w-12 h-12 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button 
            onClick={() => {
              engine?.redo();
              useSocketStore.getState().socket?.emit('draw:action', { type: 'redo' });
            }} 
            className="flex items-center justify-center w-12 h-12 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo"
          >
            <RotateCw className="w-6 h-6" />
          </button>
          <button 
            onClick={() => {
              engine?.clear();
            }} 
            className="flex items-center justify-center w-12 h-12 rounded-xl text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Clear"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
