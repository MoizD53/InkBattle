import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import type { GameResult } from '@scribble/shared';

interface GameOverOverlayProps {
  result: GameResult;
  onBackToLobby: () => void;
}

export function GameOverOverlay({ result, onBackToLobby }: GameOverOverlayProps) {
  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-2xl w-full flex flex-col items-center"
      >
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400 mb-2 drop-shadow-lg">
          GAME OVER
        </h1>
        <p className="text-slate-300 text-lg mb-12 font-medium">Final Standings</p>
        
        <div className="flex items-end justify-center gap-4 mb-12 h-64 w-full">
          {/* 2nd Place */}
          {result.players[1] && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: '70%' }}
              className="w-32 bg-slate-800 rounded-t-xl flex flex-col items-center justify-start pt-4 relative border-t-4 border-slate-400"
            >
              <div className="absolute -top-12 w-16 h-16 bg-slate-700 rounded-full border-4 border-slate-800 shadow-xl" />
              <span className="font-bold text-white mt-4 truncate w-full px-2 text-center">{result.players[1].username}</span>
              <span className="text-2xl font-black text-slate-400 mt-2">{result.players[1].totalScore}</span>
              <span className="text-sm font-black text-slate-500 absolute bottom-4">2ND</span>
            </motion.div>
          )}

          {/* 1st Place */}
          {result.players[0] && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              className="w-40 bg-slate-800 rounded-t-xl flex flex-col items-center justify-start pt-4 relative border-t-4 border-amber-400 shadow-2xl z-10"
            >
              <div className="absolute -top-16 w-20 h-20 bg-amber-500 rounded-full border-4 border-slate-800 shadow-xl flex items-center justify-center text-3xl">👑</div>
              <span className="font-bold text-white mt-6 truncate w-full px-2 text-center text-lg">{result.players[0].username}</span>
              <span className="text-3xl font-black text-amber-400 mt-2">{result.players[0].totalScore}</span>
              <span className="text-sm font-black text-amber-500 absolute bottom-4">1ST</span>
            </motion.div>
          )}

          {/* 3rd Place */}
          {result.players[2] && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: '50%' }}
              className="w-32 bg-slate-800 rounded-t-xl flex flex-col items-center justify-start pt-4 relative border-t-4 border-amber-700"
            >
              <div className="absolute -top-12 w-16 h-16 bg-slate-700 rounded-full border-4 border-slate-800 shadow-xl" />
              <span className="font-bold text-white mt-4 truncate w-full px-2 text-center">{result.players[2].username}</span>
              <span className="text-2xl font-black text-amber-700 mt-2">{result.players[2].totalScore}</span>
              <span className="text-sm font-black text-amber-800 absolute bottom-4">3RD</span>
            </motion.div>
          )}
        </div>

        <Button size="lg" onClick={onBackToLobby} className="px-12 py-6 text-xl rounded-2xl shadow-xl shadow-primary-500/20">
          Back to Lobby
        </Button>
      </motion.div>
    </div>
  );
}
