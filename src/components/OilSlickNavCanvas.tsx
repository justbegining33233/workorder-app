"use client";

import { useEffect, useRef } from "react";

/**
 * OilSlickNavCanvas
 * Same petroleum-iridescence flow field as OilSlickCanvas but
 * sized to fill its parent container rather than the full viewport.
 * Drop inside any position:relative element; it will fill it exactly.
 */

const NUM_PARTICLES = 900;
const SPEED = 1.4;

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  hue: number;
}

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

export default function OilSlickNavCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // alias as non-nullable for use inside nested frame()
    const c: CanvasRenderingContext2D = ctx;

    const parent = canvas.parentElement;
    let w = (canvas.width = parent ? parent.offsetWidth : window.innerWidth);
    let h = (canvas.height = parent ? parent.offsetHeight : 52);
    let animId: number;
    let t = 0;
    let hueBase = 0;

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, () =>
      spawn(w, h, hueBase)
    );

    c.fillStyle = "#020608";
    c.fillRect(0, 0, w, h);

    function frame() {
      t += 0.006;
      hueBase = (hueBase + 0.07) % 360;

      c.fillStyle = "rgba(2, 6, 8, 0.016)";
      c.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const angle = getAngle(p.x, p.y, t);
        const nx = p.x + Math.cos(angle) * SPEED;
        const ny = p.y + Math.sin(angle) * SPEED;

        const hue = (p.hue + p.age * 0.35 + angle * 28) % 360;
        const lifeFrac = p.age / p.maxAge;
        const sat = 65 + Math.sin(lifeFrac * Math.PI) * 28;
        const lum = 32 + Math.sin(p.age * 0.055 + 1.2) * 18;
        const alpha = Math.sin(lifeFrac * Math.PI) * 0.14 + 0.02;

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
      if (!parent) return;
      w = canvas.width = parent.offsetWidth;
      h = canvas.height = parent.offsetHeight;
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
