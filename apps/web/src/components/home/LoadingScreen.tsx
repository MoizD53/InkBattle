import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_EXPO = [0.87, 0, 0.13, 1] as const;

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'sweep' | 'glow' | 'exit'>('intro');

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('reveal'), 600),
      setTimeout(() => setPhase('sweep'), 2200),
      setTimeout(() => setPhase('glow'), 3000),
      setTimeout(() => setPhase('exit'), 3800),
      setTimeout(handleComplete, 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [handleComplete]);

  const letters = 'INKBATTLE'.split('');
  const isExiting = phase === 'exit';

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: '#030305' }}
        >
          {/* ── Layer 1: Expanding light origin ── */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              background: 'rgba(167,139,250,1)',
              boxShadow: '0 0 60px 30px rgba(139,92,246,0.4), 0 0 120px 60px rgba(139,92,246,0.15)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: phase === 'intro' ? [0, 1] : [1, 80],
              opacity: phase === 'intro' ? [0, 1] : phase === 'reveal' ? [1, 0] : 0,
            }}
            transition={{
              duration: phase === 'intro' ? 0.5 : 1.5,
              ease: EASE_OUT,
            }}
          />

          {/* ── Layer 2: Volumetric environment ── */}
          <div className="absolute inset-0">
            {/* Central aura */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: phase !== 'intro' ? 1 : 0,
                scale: phase !== 'intro' ? [0.8, 1.05, 1] : 0.5,
              }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />

            {/* Top-left ambient */}
            <motion.div
              className="absolute top-[15%] left-[20%] w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 60%)',
                filter: 'blur(60px)',
              }}
              animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Bottom-right ambient */}
            <motion.div
              className="absolute bottom-[15%] right-[20%] w-[350px] h-[350px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(192,132,252,0.05) 0%, transparent 60%)',
                filter: 'blur(60px)',
              }}
              animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* ── Layer 3: Floating dust field ── */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2.5 + 0.5,
                height: Math.random() * 2.5 + 0.5,
                background: `rgba(${167 + Math.random() * 30}, ${139 + Math.random() * 20}, 250, ${0.15 + Math.random() * 0.25})`,
                left: `${10 + Math.random() * 80}%`,
                top: `${15 + Math.random() * 70}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase !== 'intro' ? [0, 0.6, 0] : 0,
                y: [0, -(20 + Math.random() * 60)],
                x: [(Math.random() - 0.5) * 40],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                delay: 0.5 + Math.random() * 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* ── Layer 4: Logo mark entrance ── */}
          <motion.div
            className="absolute"
            style={{ top: 'calc(50% - 80px)', left: '50%', x: '-50%' }}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={
              phase !== 'intro'
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.5, y: 20 }
            }
            transition={{ duration: 1, delay: 0.2, ease: EASE_OUT }}
          >
            <motion.img
              src={"/InkBattle/" + "assets/logo.jpg"}
              alt=""
              width={56}
              height={56}
              className="select-none"
              style={{
                mixBlendMode: 'screen',
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                filter: phase === 'glow'
                  ? 'drop-shadow(0 0 30px rgba(167,139,250,0.7)) drop-shadow(0 0 60px rgba(139,92,246,0.3))'
                  : 'drop-shadow(0 0 20px rgba(139,92,246,0.4))',
                transition: 'filter 0.8s ease',
              }}
              draggable={false}
            />
          </motion.div>

          {/* ── Layer 5: Letter-by-letter text reveal ── */}
          <div className="relative flex items-center gap-[3px] mt-8 overflow-hidden">
            {letters.map((letter, i) => (
              <div key={i} className="relative overflow-hidden">
                <motion.span
                  className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[0.15em] select-none block bg-clip-text text-transparent"
                  style={{
                    fontFamily: '"Outfit", system-ui, sans-serif',
                    backgroundImage:
                      phase === 'glow'
                        ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #c4b5fd 60%, #f1f5f9 100%)'
                        : 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #c084fc 80%, #a78bfa 100%)',
                    backgroundSize: '200% 200%',
                    animation: phase === 'glow' ? 'gradient-shift 3s ease infinite' : 'none',
                  }}
                  initial={{ y: '120%', opacity: 0 }}
                  animate={
                    phase !== 'intro'
                      ? { y: '0%', opacity: 1 }
                      : { y: '120%', opacity: 0 }
                  }
                  transition={{
                    duration: 0.8,
                    delay: 0.4 + i * 0.06,
                    ease: EASE_OUT,
                  }}
                >
                  {letter}
                </motion.span>
              </div>
            ))}

            {/* Light sweep across text */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 0%, transparent 35%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 65%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              initial={{ x: '-100%' }}
              animate={
                phase === 'sweep' || phase === 'glow'
                  ? { x: '200%' }
                  : { x: '-100%' }
              }
              transition={{ duration: 1.2, ease: EASE_EXPO }}
            />
          </div>

          {/* ── Layer 6: Tagline fade ── */}
          <motion.p
            className="absolute text-[11px] uppercase tracking-[0.3em] text-white/20 font-medium"
            style={{
              top: 'calc(50% + 60px)',
              fontFamily: '"Outfit", system-ui, sans-serif',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={
              phase === 'sweep' || phase === 'glow'
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 8 }
            }
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            Where art meets competition
          </motion.p>


          {/* ── Layer 8: Burst particles on glow ── */}
          {phase === 'glow' &&
            Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const dist = 80 + Math.random() * 120;
              return (
                <motion.div
                  key={`burst-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 2 + Math.random() * 3,
                    height: 2 + Math.random() * 3,
                    background: `rgba(${167 + Math.random() * 50}, ${139 + Math.random() * 30}, 250, 0.6)`,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{
                    duration: 1 + Math.random() * 0.5,
                    ease: 'easeOut',
                  }}
                />
              );
            })}

          {/* ── Noise texture overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px',
            }}
          />
        </motion.div>
      )}

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </AnimatePresence>
  );
}
