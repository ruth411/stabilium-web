"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

export function WavesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      const resolveColor = (variables: string[], alpha = 1) => {
        const tempEl = document.createElement("div");
        tempEl.style.position = "absolute";
        tempEl.style.visibility = "hidden";
        tempEl.style.width = "1px";
        tempEl.style.height = "1px";
        document.body.appendChild(tempEl);
        let color = `rgba(255,255,255,${alpha})`;
        for (const variable of variables) {
          tempEl.style.backgroundColor = `var(${variable})`;
          const computed = getComputedStyle(tempEl).backgroundColor;
          if (computed && computed !== "rgba(0, 0, 0, 0)") {
            if (alpha < 1) {
              const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              color = m ? `rgba(${m[1]},${m[2]},${m[3]},${alpha})` : computed;
            } else {
              color = computed;
            }
            break;
          }
        }
        document.body.removeChild(tempEl);
        return color;
      };

      return {
        backgroundTop: resolveColor(["--background"], 1),
        backgroundBottom: resolveColor(["--muted", "--background"], 0.97),
        wavePalette: [
          { offset: 0,             amplitude: 70, frequency: 0.003,  color: resolveColor(["--primary"], 0.8),              opacity: 0.45 },
          { offset: Math.PI / 2,   amplitude: 90, frequency: 0.0026, color: resolveColor(["--accent", "--primary"], 0.7),  opacity: 0.35 },
          { offset: Math.PI,       amplitude: 60, frequency: 0.0034, color: resolveColor(["--secondary","--foreground"], 0.65), opacity: 0.3  },
          { offset: Math.PI * 1.5, amplitude: 80, frequency: 0.0022, color: resolveColor(["--foreground"], 0.25),          opacity: 0.25 },
          { offset: Math.PI * 2,   amplitude: 55, frequency: 0.004,  color: resolveColor(["--foreground"], 0.2),           opacity: 0.2  },
        ] satisfies WaveConfig[],
      };
    };

    let themeColors = computeThemeColors();
    const observer = new MutationObserver(() => { themeColors = computeThemeColors(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const recenter = () => {
      const c = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = { ...c };
      targetMouseRef.current = { ...c };
    };

    resize();
    recenter();
    window.addEventListener("resize", () => { resize(); recenter(); });
    window.addEventListener("mousemove", (e) => { targetMouseRef.current = { x: e.clientX, y: e.clientY }; });
    window.addEventListener("mouseleave", recenter);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / influenceRadius);
        const mouseEffect = influence * mouseInfluence * Math.sin(time * 0.001 + x * 0.01 + wave.offset);
        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.45) +
          mouseEffect;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth   = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur  = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      time += 1;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, themeColors.backgroundTop);
      grad.addColorStop(1, themeColors.backgroundBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      themeColors.wavePalette.forEach(drawWave);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}
