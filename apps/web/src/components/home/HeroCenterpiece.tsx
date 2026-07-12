import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroCenterpiece() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-visible">
      {/* ─── Massive 3D Container ─── */}
      <motion.div
        className="relative w-[900px] h-[600px] perspective-[2000px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: EASE }}
      >
        <motion.div
          className="w-full h-full preserve-3d"
          animate={{
            rotateX: [15, 12, 15],
            rotateY: [-20, -15, -20],
            y: [-10, 10, -10],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ─── The Holographic Canvas ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(10,5,20,0.4) 100%)',
              border: '1px solid rgba(167,139,250,0.3)',
              boxShadow: '0 0 100px -20px rgba(139,92,246,0.3), inset 0 0 40px rgba(139,92,246,0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Live Drawing SVG */}
            <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 900 600">
              <defs>
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Glowing paint strokes */}
              <motion.path
                d="M 200 400 C 300 100, 500 100, 600 400 S 800 200, 700 100"
                fill="none"
                stroke="#c084fc"
                strokeWidth="12"
                strokeLinecap="round"
                filter="url(#neon-glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
              />
              <motion.path
                d="M 300 500 C 400 300, 600 200, 500 100"
                fill="none"
                stroke="#818cf8"
                strokeWidth="8"
                strokeLinecap="round"
                filter="url(#neon-glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 5, delay: 1, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
              />
            </svg>
          </div>

          {/* ─── Animated Cursors ─── */}
          <motion.div
            className="absolute z-10 flex flex-col items-center drop-shadow-xl"
            animate={{
              x: [200, 500, 700, 200],
              y: [400, 100, 400, 400],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ translateZ: 10 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#c084fc">
              <path d="M4.5 3L20 10.5L12.5 13.5L10 21L4.5 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c084fc] text-white">Ghost</span>
          </motion.div>

          <motion.div
            className="absolute z-10 flex flex-col items-center drop-shadow-xl"
            animate={{
              x: [300, 600, 500, 300],
              y: [500, 200, 100, 500],
            }}
            transition={{ duration: 10, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ translateZ: 15 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#818cf8">
              <path d="M4.5 3L20 10.5L12.5 13.5L10 21L4.5 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#818cf8] text-white">NinjaDraws</span>
          </motion.div>

          {/* ─── Ambient HUD: Leaderboard ─── */}
          <motion.div
            className="absolute -left-16 top-24 w-48 rounded-xl p-4"
            style={{
              background: 'rgba(20,10,30,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              transform: 'translateZ(60px)',
            }}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-3">Live Ranks</div>
            <div className="space-y-2">
              {[
                { name: 'Ghost', score: 1450, color: 'text-purple-400' },
                { name: 'NinjaDraws', score: 1200, color: 'text-indigo-400' },
                { name: 'ArtKing', score: 950, color: 'text-slate-300' },
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/90">{p.name}</span>
                  <span className={`font-mono font-bold ${p.color}`}>{p.score}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Ambient HUD: Round Timer ─── */}
          <motion.div
            className="absolute -right-8 -top-8 px-6 py-3 rounded-xl flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, rgba(30,10,50,0.8) 0%, rgba(10,5,20,0.9) 100%)',
              border: '1px solid rgba(167,139,250,0.4)',
              boxShadow: '0 0 30px rgba(167,139,250,0.2)',
              backdropFilter: 'blur(16px)',
              transform: 'translateZ(80px)',
            }}
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <div className="text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase mb-1">Round Ends</div>
            <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
              00:45
            </div>
          </motion.div>

          {/* ─── Floating Chat Bubbles ─── */}
          <motion.div
            className="absolute right-12 bottom-32 px-4 py-2 rounded-2xl rounded-br-sm text-xs font-medium text-white shadow-xl"
            style={{
              background: 'rgba(167,139,250,0.2)',
              border: '1px solid rgba(167,139,250,0.3)',
              backdropFilter: 'blur(8px)',
              transform: 'translateZ(40px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.9],
              y: [10, 0, 0, -10],
            }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          >
            It's a dragon! 🐉
          </motion.div>

          <motion.div
            className="absolute left-32 bottom-20 px-4 py-2 rounded-2xl rounded-bl-sm text-xs font-medium text-white shadow-xl"
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(8px)',
              transform: 'translateZ(50px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.9],
              y: [10, 0, 0, -10],
            }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, delay: 2 }}
          >
            Wait no, it's a snake??
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
}
