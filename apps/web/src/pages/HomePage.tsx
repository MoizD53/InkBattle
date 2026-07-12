import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { Play } from 'lucide-react';
import { LoadingScreen } from '../components/home/LoadingScreen';
import { HeroCenterpiece } from '../components/home/HeroCenterpiece';
import { GamePreviewMockup } from '../components/home/GamePreviewMockup';
import { AmbientParticles } from '../components/home/AmbientParticles';

// Premium easing curve — heavy, intentional, Apple-like
const EASE = [0.16, 1, 0.3, 1] as const;

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const { isAuthenticated } = useAuthStore();

  // Hero dissolves on scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.97]);
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -40]);

  const loaded = !showLoading;

  return (
    <>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}

      <div className="h-full overflow-y-auto overflow-x-hidden relative scroll-smooth bg-[#050508] text-white selection:bg-violet-500/30">

        {/* ─── Immersive Background Environment ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Primary volumetric glow */}
          <motion.div
            className="absolute top-[10%] left-[20%] w-[800px] h-[800px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)',
              filter: 'blur(80px)',
            }}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -50, 100, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Secondary ambient */}
          <motion.div
            className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
              filter: 'blur(80px)',
            }}
            animate={{
              x: [0, -80, 40, 0],
              y: [0, 60, -80, 0],
              scale: [1, 1.2, 0.85, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Third glow for more dimension */}
          <motion.div
            className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(192,132,252,0.05) 0%, transparent 65%)',
              filter: 'blur(60px)',
            }}
            animate={{
              scale: [0.8, 1.3, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Subtle noise overlay for texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px',
            }}
          />
        </div>

        {/* ─── Ambient Particle Field ─── */}
        <AmbientParticles />

        {/* ─── Immersive Multiplayer Centerpiece ─── */}
        <HeroCenterpiece />

        {/* ─── Hero Section ─── */}
        <motion.section
          className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 pb-32 z-10"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          {/* Staggered content reveal */}
          <motion.div
            initial="hidden"
            animate={loaded ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.12, delayChildren: 0.3 },
              },
            }}
            className="text-center max-w-5xl mx-auto flex flex-col items-center relative z-30"
          >

            {/* Status badge */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
              }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-10"
              style={{
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
                style={{ boxShadow: '0 0 8px rgba(167,139,250,0.6)' }}
              />
              <span className="text-xs font-medium tracking-wide text-white/50">
                Now in public beta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
              }}
              className="text-[clamp(3rem,8vw,7.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-8 font-display"
            >
              <span className="text-white/95 block">Draw. Guess.</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #c084fc 70%, #a78bfa 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 8s ease infinite',
                }}
              >
                Win Together.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
              }}
              className="text-lg sm:text-xl text-white/35 mb-14 max-w-lg mx-auto font-medium leading-relaxed tracking-[-0.01em]"
            >
              Where art meets competition.
              <br className="hidden sm:block" />
              Crafted for those who play to win.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
              }}
              className="relative z-40"
            >
              <Link to={isAuthenticated ? "/lobby" : "/login"}>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="group relative overflow-hidden flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-base tracking-[-0.01em] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(226,232,240,0.9) 100%)',
                    color: '#0a0a12',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px -12px rgba(139,92,246,0.25), 0 8px 20px -8px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Hover gradient overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(192,132,252,0.08) 100%)',
                    }}
                  />
                  {/* Glow on hover */}
                  <div
                    className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl -z-10"
                    style={{
                      background: 'radial-gradient(ellipse, rgba(167,139,250,0.2) 0%, transparent 70%)',
                      filter: 'blur(16px)',
                    }}
                  />
                  <Play className="w-5 h-5 fill-current relative z-10" />
                  <span className="relative z-10">Start Playing</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.6, ease: EASE } },
              }}
              className="mt-16 relative z-40"
            >
              <div 
                className="flex items-center rounded-2xl overflow-hidden backdrop-blur-md"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px -8px rgba(0,0,0,0.4)',
                }}
              >
                {[
                  { value: '120', suffix: 'Hz', label: 'Canvas' },
                  { value: '<16', suffix: 'ms', label: 'Latency' },
                  { value: '16', suffix: '', label: 'Players' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex relative">
                    <div className="px-8 py-5 text-center">
                      <div className="flex items-baseline justify-center gap-0.5">
                        <span className="text-xl font-bold font-display text-white/90 tabular-nums tracking-tight">
                          {stat.value}
                        </span>
                        {stat.suffix && (
                          <span className="text-xs font-semibold text-white/40">
                            {stat.suffix}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1 font-medium">
                        {stat.label}
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ─── Game Preview Section ─── */}
        <section className="relative z-10 pb-32 px-4">
          <GamePreviewMockup />
        </section>

        {/* ─── Fade-out footer ─── */}
        <footer className="relative z-20 py-16 text-center">
          <p className="text-white/20 text-[10px] font-semibold tracking-[0.3em] uppercase font-display">
            InkBattle © 2026
          </p>
        </footer>
      </div>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </>
  );
}