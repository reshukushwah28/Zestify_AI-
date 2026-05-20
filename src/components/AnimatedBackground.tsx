import React, { useEffect, useRef } from 'react';

interface Dot {
  x: number; y: number;
  vx: number; vy: number;
  r: number; color: string;
  alpha: number; phase: number; phaseSpeed: number;
}

const COLORS = ['#f97316', '#fb923c', '#14b8a6', '#ec4899', '#f59e0b', '#06b6d4'];

function spawnDots(w: number, h: number): Dot[] {
  return Array.from({ length: 30 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.25 + Math.random() * 0.45;
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 1.5 + Math.random() * 3.5,
      color: COLORS[i % COLORS.length],
      alpha: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.007 + Math.random() * 0.01,
    };
  });
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef   = useRef<Dot[]>([]);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dotsRef.current = spawnDots(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = () => {
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = '#0e0c0a';
      ctx.fillRect(0, 0, W, H);

      // Warm amber glow — center
      const g1 = ctx.createRadialGradient(W * 0.5, H * 0.65, 0, W * 0.5, H * 0.65, W * 0.55);
      g1.addColorStop(0, 'rgba(80,35,8,0.55)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      // Cool teal glow — top-left
      const g2 = ctx.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, W * 0.35);
      g2.addColorStop(0, 'rgba(15,30,50,0.5)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

      // Particles
      for (const d of dotsRef.current) {
        d.x += d.vx; d.y += d.vy;
        d.phase += d.phaseSpeed;

        if (d.x < 0) { d.x = 0; d.vx *= -1; }
        if (d.x > W) { d.x = W; d.vx *= -1; }
        if (d.y < 0) { d.y = 0; d.vy *= -1; }
        if (d.y > H) { d.y = H; d.vy *= -1; }

        const pulse  = Math.sin(d.phase) * 0.2;
        const glowR  = d.r * (3 + pulse);
        const alpha  = Math.min(d.alpha + pulse * 0.15, 1);

        const gd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, glowR);
        gd.addColorStop(0, d.color + 'bb');
        gd.addColorStop(1, d.color + '00');
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath(); ctx.arc(d.x, d.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gd; ctx.fill();

        ctx.globalAlpha = Math.min(alpha * 1.3, 1);
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color; ctx.fill();

        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
