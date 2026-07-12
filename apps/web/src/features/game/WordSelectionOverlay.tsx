import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

interface WordSelectionOverlayProps {
  choices: string[];
  onSelect: (word: string) => void;
}

export function WordSelectionOverlay({ choices, onSelect }: WordSelectionOverlayProps) {
  if (choices.length === 0) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 max-w-lg w-full text-center border border-white/20 dark:border-white/10 shadow-2xl"
      >
        <h2 className="text-3xl font-black mb-2 text-white">Choose a Word</h2>
        <p className="text-slate-300 mb-8">Pick what you want to draw this round</p>
        
        <div className="flex flex-col gap-4">
          {choices.map((word) => (
            <Button 
              key={word}
              size="lg"
              variant="secondary"
              className="w-full text-xl py-6 hover:scale-[1.02] transition-transform"
              onClick={() => onSelect(word)}
            >
              {word}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
