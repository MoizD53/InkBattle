import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { Users, Copy, Play, Check } from 'lucide-react';
import type { RoomInfo } from '@scribble/shared';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user, token } = useAuthStore();
  const { socket, connect } = useSocketStore();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    connect(token);
  }, [user, token, connect, navigate]);

  useEffect(() => {
    if (!socket || !code) return;

    socket.emit('room:join', code, (room, err) => {
      if (room) {
        setRoom(room);
      } else {
        setError(err || 'Failed to join room');
      }
    });

    socket.on('room:updated', (updatedRoom: RoomInfo) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'playing') {
        navigate(`/game/${updatedRoom.id}`);
      }
    });

    return () => {
      socket.off('room:updated');
    };
  }, [socket, code, navigate]);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStart = () => {
    if (socket) {
      socket.emit('game:start');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-slate-600">{error}</p>
        <Button onClick={() => navigate('/lobby')}>Back to Lobby</Button>
      </div>
    );
  }

  if (!room) {
    return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
  }

  const currentPlayer = room.players.find(p => p.id === user?.id);
  const isHost = currentPlayer?.isHost || false;

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="text-center mb-10 relative z-10">
          <h1 className="text-4xl font-black mb-2">Waiting Room</h1>
          <p className="text-slate-500 text-lg">Invite your friends to join</p>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-800 flex items-center justify-between relative z-10">
          <div>
            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Room Code</div>
            <div className="text-4xl font-black tracking-widest uppercase">{code}</div>
          </div>
          <Button variant="secondary" size="lg" onClick={copyCode} className="rounded-xl px-6">
            {copied ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <Copy className="w-5 h-5 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Players ({room.players.length}/{room.settings.maxPlayers})
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {room.players.map((p) => (
              <div key={p.id} className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 ${p.isHost ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                <div className="relative">
                  <Avatar username={p.username} url={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${p.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`} size="lg" />
                  {p.isHost && <div className="absolute -top-1 -right-1 text-lg z-10 drop-shadow-md">👑</div>}
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-sm truncate w-full text-center">{p.username}</span>
                  {p.id === user?.id && <span className="text-[10px] uppercase font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full mt-1">You</span>}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, room.settings.maxPlayers - room.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center h-[104px]">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-2" />
                <span className="text-xs text-slate-400 font-medium">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center relative z-10">
          {isHost ? (
            <Button size="lg" onClick={handleStart} className="w-full sm:w-auto px-12 py-6 text-lg rounded-2xl shadow-xl shadow-primary-500/20">
              <Play className="w-6 h-6 mr-3 fill-current" />
              Start Game
            </Button>
          ) : (
            <div className="text-slate-500 font-medium bg-slate-100 dark:bg-slate-900 px-8 py-4 rounded-2xl">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}