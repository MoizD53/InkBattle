import { motion } from 'framer-motion';
import type { RoundResult, PlayerState } from '@scribble/shared';

interface RoundResultOverlayProps {
  result: RoundResult;
  players: PlayerState[];
}

export function RoundResultOverlay({ result, players }: RoundResultOverlayProps) {
  // Sort guessers by time to guess, fastest first
  const sortedGuessers = [...result.guessers].sort((a, b) => a.timeToGuess - b.timeToGuess);
  
  const drawer = players.find(p => p.id === result.drawerId);

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 max-w-lg w-full text-center border border-white/20 dark:border-white/10 shadow-2xl"
      >
        <h3 className="text-xl text-primary-400 font-bold uppercase tracking-widest mb-1">Round {result.round} Over</h3>
        <h2 className="text-3xl text-white mb-6">The word was <span className="font-black text-primary-400">{result.word}</span></h2>
        
        <div className="bg-slate-900/50 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Drawer</span>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Score</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700" />
              <span className="font-bold text-white">{drawer?.username || 'Unknown Drawer'}</span>
            </div>
            <span className="font-bold text-green-400">+{result.drawerScore}</span>
          </div>
        </div>

        {sortedGuessers.length > 0 ? (
          <div className="bg-slate-900/50 rounded-2xl p-4 text-left max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Guessers</span>
              <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Score</span>
            </div>
            <div className="flex flex-col gap-2">
              {sortedGuessers.map((g, i) => (
                <div key={g.playerId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-slate-500 font-bold text-sm">#{i+1}</span>
                    <span className="font-bold text-white">{g.username}</span>
                  </div>
                  <span className="font-bold text-green-400">+{g.score}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-2xl p-6 text-slate-400 font-medium">
            Nobody guessed the word!
          </div>
        )}
      </motion.div>
    </div>
  );
}
