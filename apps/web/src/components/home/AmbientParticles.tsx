import { useEffect, useRef } from 'react';

/**
 * Subtle floating particle field with volumetric dust motes
 * Replaces the old "paint trail" with an ambient atmospheric layer
 * Uses raw Canvas for maximum GPU performance
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDir: number;
  color: string;
}

const PARTICLE_COUNT = 150;
const COLORS = [
  'rgba(139,92,246,',   // violet
  'rgba(129,140,248,',  // indigo
  'rgba(192,132,252,',  // purple
  'rgba(167,139,250,',  // lighter violet
  'rgba(255,255,255,',  // white dust
];

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles with 3D depth simulation
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const zDepth = Math.random(); // 0 is far, 1 is near
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (0.1 + zDepth * 0.4),
        vy: (Math.random() - 0.5) * 0.1 - (0.05 + zDepth * 0.2), // upward drift based on depth
        radius: Math.random() * (1 + zDepth * 2) + 0.5,
        alpha: Math.random() * (0.2 + zDepth * 0.3),
        alphaDir: (Math.random() - 0.5) * 0.008,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      });
    }

    let rAF: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Breathing alpha
        p.alpha += p.alphaDir;
        if (p.alpha <= 0.05 || p.alpha >= 0.5) {
          p.alphaDir *= -1;
        }

        // Wrap around
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      }

      rAF = requestAnimationFrame(render);
    };

    rAF = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rAF);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[2]"
      style={{ opacity: 0.7 }}
    />
  );
}
