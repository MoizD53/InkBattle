import { create } from 'zustand';
import type { DrawingTool } from '@scribble/shared';
import { BRUSH_SIZES, DRAWING_COLORS } from '@scribble/shared';

interface DrawingStore {
  tool: DrawingTool;
  color: string;
  brushSize: number;
  setTool: (tool: DrawingTool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
}

export const useDrawingStore = create<DrawingStore>((set) => ({
  tool: 'brush',
  color: DRAWING_COLORS[0] || '#000000',
  brushSize: BRUSH_SIZES[1] || 8,
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (brushSize) => set({ brushSize }),
}));
