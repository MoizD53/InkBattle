import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { Button } from '../components/ui/Button';
import { Plus, Users, Search, Play } from 'lucide-react';
import type { PublicRoom } from '@scribble/shared';

export default function LobbyPage() {
  const { user, token } = useAuthStore();
  const { socket, connect } = useSocketStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    // Ensure socket connection
    connect(token);
  }, [user, token, connect, navigate]);

  useEffect(() => {
    if (!socket) return;
    
    // Just listen for any room updates. A proper implementation might fetch the list on mount via HTTP
    // or request it via socket event.
    socket.on('room:list', (roomList: PublicRoom[]) => {
      setRooms(roomList);
    });

    return () => {
      socket.off('room:list');
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setIsCreating(true);
    socket.emit('room:create', { isPrivate: false }, (room) => {
      setIsCreating(false);
      if (room) {
        navigate(`/room/${room.code}`);
      } else {
        alert('Failed to create room');
      }
    });
  };

  const handleJoinRoom = (code: string) => {
    navigate(`/room/${code.toUpperCase()}`);
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2">Lobby</h1>
            <p className="text-slate-500">Welcome back, {user?.username}. Find a game or start your own.</p>
          </div>
          <Button size="lg" onClick={handleCreateRoom} loading={isCreating} className="rounded-xl px-8 shadow-xl shadow-primary-500/20">
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join Private Room */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 glass rounded-3xl p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              Join Private Game
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter Room Code" 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 uppercase tracking-widest text-center font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                maxLength={6}
              />
              <Button 
                onClick={() => handleJoinRoom(roomCode)} 
                disabled={roomCode.length < 4}
                className="w-full rounded-xl"
              >
                Join Game
              </Button>
            </div>
          </motion.div>

          {/* Public Rooms */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass rounded-3xl p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Public Games
            </h3>
            
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  No public games available right now.
                  <br />
                  Be the first to create one!
                </div>
              ) : (
                rooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold">{room.hostName}'s Game</span>
                      <span className="text-sm text-slate-500">{room.playerCount}/{room.maxPlayers} Players • {room.status}</span>
                    </div>
                    <Button 
                      variant={room.playerCount >= room.maxPlayers ? 'secondary' : 'primary'} 
                      onClick={() => handleJoinRoom(room.code)}
                      disabled={room.playerCount >= room.maxPlayers}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}