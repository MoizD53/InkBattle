import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@scribble/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketStore {
  socket: AppSocket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) {
      if (existing.auth && (existing.auth as any).token === token) {
        return; // Already connected with the correct token
      }
      existing.disconnect(); // Disconnect old socket
    }

    const socket: AppSocket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
