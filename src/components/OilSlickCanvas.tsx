"use client";

import { useEffect, useRef } from "react";

/**
 * OilSlickCanvas
 * Renders a full-screen canvas animation that simulates petroleum iridescence
 * on dark water — thin swirling streaks of colour driven by a layered sine-wave
 * flow field. No external libraries required.
 */

const NUM_PARTICLES = 1200;
const SPEED = 1.6;

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  hue: number;
}

/** Multi-octave smooth noise approximation — no library needed */
function fieldNoise(x: number, y: number, t: number): number {
  const s = 0.0022;
  return (
    Math.sin(x * s * 1.2 + t * 0.22) * Math.cos(y * s * 0.85 + t * 0.16) +
    Math.sin(x * s * 2.6 + y * s * 1.9 + t * 0.11) * 0.44 +
    Math.cos(x * s * 0.75 - y * s * 2.4 + t * 0.19) * 0.37 +
    Math.sin(x * s * 3.3 + y * s * 0.55 + t * 0.065) * 0.21 +
    Math.cos(x * s * 1.55 + y * s * 2.9 - t * 0.14) * 0.27
  );
}

function getAngle(x: number, y: number, t: number): number {
  return fieldNoise(x, y, t) * Math.PI * 2.8;
}

function spawn(w: number, h: number, hueBase: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    age: 0,
    maxAge: 90 + Math.random() * 140,
    hue: (hueBase + Math.random() * 55) % 360,
  };
}

export default function OilSlickCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c: CanvasRenderingContext2D = ctx;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId: number;
    let t = 0;
    let hueBase = 0;

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, () =>
      spawn(w, h, hueBase)
    );

    // Seed the canvas black
    c.fillStyle = "#020608";
    c.fillRect(0, 0, w, h);

    function frame() {
      t += 0.006;
      hueBase = (hueBase + 0.07) % 360;

      // Very slow dark fade — lets trails linger like real oil on water
      c.fillStyle = "rgba(2, 6, 8, 0.016)";
      c.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const angle = getAngle(p.x, p.y, t);
        const nx = p.x + Math.cos(angle) * SPEED;
        const ny = p.y + Math.sin(angle) * SPEED;

        // Iridescent hue shifts with flow angle and age — key to the oil look
        const hue = (p.hue + p.age * 0.35 + angle * 28) % 360;
        // Saturation: high in mid-life, muted at start/end
        const lifeFrac = p.age / p.maxAge;
        const sat = 65 + Math.sin(lifeFrac * Math.PI) * 28; // 65–93 %
        // Lightness: 30–55 % — dark, metallic, not neon
        const lum = 32 + Math.sin(p.age * 0.055 + 1.2) * 18;
        // Alpha: fade in, hold, fade out — very low so streaks accumulate
        const alpha =
          Math.sin(lifeFrac * Math.PI) * 0.14 +
          0.02;

        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(nx, ny);
        c.strokeStyle = `hsla(${hue},${sat.toFixed(0)}%,${lum.toFixed(0)}%,${alpha.toFixed(3)})`;
        c.lineWidth = 1.0 + Math.sin(p.age * 0.07) * 0.5;
        c.stroke();

        p.x = nx;
        p.y = ny;
        p.age++;

        if (p.age > p.maxAge || nx < -4 || nx > w + 4 || ny < -4 || ny > h + 4) {
          particles[i] = spawn(w, h, hueBase);
        }
      }

      animId = requestAnimationFrame(frame);
    }

    frame();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      c.fillStyle = "#020608";
      c.fillRect(0, 0, w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
