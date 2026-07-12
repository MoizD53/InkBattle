import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Live animated game preview — cinematic glass panel mockup
 * Shows a simulated round in progress: drawing, chat, timer, scoreboard
 * Everything loops organically
 */

interface ChatMsg {
  id: number;
  user: string;
  text: string;
  isCorrect?: boolean;
}

export function GamePreviewMockup() {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [timer, setTimer] = useState(45);
  const [scores, setScores] = useState([
    { name: 'Aria', score: 240, color: '#a78bfa' },
    { name: 'Kai', score: 180, color: '#818cf8' },
    { name: 'Zoe', score: 120, color: '#c084fc' },
    { name: 'Leo', score: 60, color: '#6366f1' },
  ]);
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      const t = tickRef.current;

      // Timer countdown
      if (t % 3 === 0) setTimer(prev => Math.max(0, prev - 1));

      // Simulated chat
      if (t === 8) setChat(prev => [...prev, { id: t, user: 'Kai', text: 'a house?' }]);
      if (t === 16) setChat(prev => [...prev, { id: t, user: 'Zoe', text: 'lighthouse' }]);
      if (t === 24) setChat(prev => [...prev, { id: t, user: 'Leo', text: 'castle' }]);
      if (t === 32) {
        setChat(prev => [...prev, { id: t, user: '', text: 'Zoe guessed the word!', isCorrect: true }]);
        setScores(prev => prev.map(s => s.name === 'Zoe' ? { ...s, score: s.score + 150 } : s));
      }
      if (t === 40) setChat(prev => [...prev, { id: t, user: 'Aria', text: 'gg!' }]);

      // Reset loop
      if (t > 60) {
        tickRef.current = 0;
        setChat([]);
        setTimer(45);
        setScores([
          { name: 'Aria', score: 240, color: '#a78bfa' },
          { name: 'Kai', score: 180, color: '#818cf8' },
          { name: 'Zoe', score: 120, color: '#c084fc' },
          { name: 'Leo', score: 60, color: '#6366f1' },
        ]);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative w-full max-w-5xl mx-auto"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow behind the card */}
      <div
        className="absolute -inset-8 z-0 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.12) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Glass panel */}
      <div
        className="relative z-10 rounded-2xl overflow-hidden border border-white/[0.06]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.85) 0%, rgba(10,10,18,0.92) 100%)',
          backdropFilter: 'blur(40px) saturate(1.2)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center h-11 px-5 border-b border-white/[0.04]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 text-center text-xs text-white/20 font-medium tracking-wider">
            INKBATTLE — ROOM ABC123
          </div>
        </div>

        <div className="flex h-[340px]">
          {/* Scoreboard */}
          <div className="w-44 border-r border-white/[0.04] p-3 flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold px-1 mb-1">Players</div>
            {scores
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <motion.div
                  key={p.name}
                  layout
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                  style={{ background: i === 0 ? 'rgba(139,92,246,0.08)' : 'transparent' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0"
                    style={{ background: `${p.color}22`, border: `1px solid ${p.color}33` }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white/70 truncate">{p.name}</div>
                    <div className="text-[10px] text-white/30 tabular-nums">{p.score} pts</div>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 h-10 border-b border-white/[0.04]">
              <div className="text-sm font-mono font-bold text-white/60 tabular-nums">{timer}s</div>
              <div className="text-lg tracking-[0.4em] font-black text-white/30">_ _ _ _ _</div>
              <div className="text-xs text-violet-400/60 font-semibold">Round 2/3</div>
            </div>

            {/* Drawing canvas */}
            <div className="flex-1 relative bg-[#0a0a12]">
              <svg viewBox="0 0 500 260" className="absolute inset-0 w-full h-full">
                {/* Animated drawing path — a simple house */}
                <motion.path
                  d="M180 200 L180 130 L250 80 L320 130 L320 200 Z M220 200 L220 160 L280 160 L280 200 M200 150 L195 130 M300 150 L305 130"
                  fill="transparent"
                  stroke="rgba(167,139,250,0.5)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
                />
              </svg>
            </div>
          </div>

          {/* Chat */}
          <div className="w-52 border-l border-white/[0.04] flex flex-col">
            <div className="flex-1 p-3 flex flex-col gap-1.5 justify-end overflow-hidden">
              {chat.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-[11px] leading-relaxed ${
                    msg.isCorrect
                      ? 'text-emerald-400/80 font-semibold bg-emerald-500/[0.06] px-2 py-1.5 rounded-md border border-emerald-500/10'
                      : 'text-white/40'
                  }`}
                >
                  {!msg.isCorrect && <span className="font-semibold text-white/55 mr-1.5">{msg.user}</span>}
                  {msg.text}
                </motion.div>
              ))}
            </div>
            <div className="p-3 border-t border-white/[0.04]">
              <div className="h-7 bg-white/[0.03] rounded-md border border-white/[0.04]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
