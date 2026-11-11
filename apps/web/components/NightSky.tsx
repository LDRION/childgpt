'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  hue: string;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const PALETTE = ['255, 246, 214', '214, 226, 255', '255, 214, 236', '255, 255, 255'];

// Детерминированный ГПСЧ — одинаковое небо при каждом рендере, без «прыжков» звёзд.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function NightSky({ density = 1, shootingStars = true, className }: { density?: number; shootingStars?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Star[] = [];
    let shooting: Shooting | null = null;
    let nextShootingAt = performance.now() + 4000;
    let raf = 0;
    let width = 0;
    let height = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rand = mulberry32(20261023);
      const count = Math.min(320, Math.round(((width * height) / 5200) * density));
      stars = Array.from({ length: count }, () => {
        const big = rand() > 0.94;
        return {
          x: rand() * width,
          // Больше звёзд в верхней части неба — как настоящий небосвод над горизонтом.
          y: Math.pow(rand(), 1.35) * height,
          r: big ? 1.3 + rand() * 1.1 : 0.35 + rand() * 0.9,
          phase: rand() * Math.PI * 2,
          speed: 0.4 + rand() * 1.4,
          hue: PALETTE[Math.floor(rand() * PALETTE.length)] ?? PALETTE[0]!,
        };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.hue}, ${twinkle})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          ctx.fillStyle = `rgba(${s.hue}, ${twinkle * 0.18})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduceMotion && shootingStars) {
        if (!shooting && t > nextShootingAt) {
          shooting = { x: width * (0.2 + Math.random() * 0.6), y: height * Math.random() * 0.3, vx: 7 + Math.random() * 4, vy: 2.5 + Math.random() * 2, life: 1 };
        }
        if (shooting) {
          const s = shooting;
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
          grad.addColorStop(0, `rgba(255, 248, 220, ${s.life})`);
          grad.addColorStop(1, 'rgba(255, 248, 220, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
          ctx.stroke();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.012;
          if (s.life <= 0 || s.x > width + 50 || s.y > height) {
            shooting = null;
            nextShootingAt = t + 6000 + Math.random() * 9000;
          }
        }
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    build();
    if (reduceMotion) draw(0);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      build();
      if (reduceMotion) draw(0);
    });
    ro.observe(canvas);

    const onVisibility = () => {
      if (reduceMotion) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density, shootingStars]);

  return <canvas ref={ref} className={className ?? 'night-sky'} aria-hidden="true" />;
}
