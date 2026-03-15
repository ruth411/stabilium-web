"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Point = { x: number; y: number };

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

const highlightPills = ["100+ benchmark cases", "6 stability metrics", "Release-ready evidence"] as const;

const heroStats: { label: string; value: string }[] = [
  { label: "Benchmark cases", value: "100+" },
  { label: "Stability metrics", value: "6" },
  { label: "AI providers", value: "2+" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

export function GlowyWavesHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

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
        let color = `rgba(255, 255, 255, ${alpha})`;
        for (const variable of variables) {
          tempEl.style.backgroundColor = `var(${variable})`;
          const computedColor = getComputedStyle(tempEl).backgroundColor;
          if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
            if (alpha < 1) {
              const m = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (m) color = `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
              else color = computedColor;
            } else {
              color = computedColor;
            }
            break;
          }
        }
        document.body.removeChild(tempEl);
        return color;
      };

      return {
        backgroundTop: resolveColor(["--background"], 1),
        backgroundBottom: resolveColor(["--muted", "--background"], 0.95),
        wavePalette: [
          { offset: 0, amplitude: 70, frequency: 0.003, color: resolveColor(["--primary"], 0.8), opacity: 0.45 },
          { offset: Math.PI / 2, amplitude: 90, frequency: 0.0026, color: resolveColor(["--accent", "--primary"], 0.7), opacity: 0.35 },
          { offset: Math.PI, amplitude: 60, frequency: 0.0034, color: resolveColor(["--secondary", "--foreground"], 0.65), opacity: 0.3 },
          { offset: Math.PI * 1.5, amplitude: 80, frequency: 0.0022, color: resolveColor(["--primary-foreground", "--foreground"], 0.25), opacity: 0.25 },
          { offset: Math.PI * 2, amplitude: 55, frequency: 0.004, color: resolveColor(["--foreground"], 0.2), opacity: 0.2 },
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

    const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const recenterMouse = () => {
      const c = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = c;
      targetMouseRef.current = c;
    };
    const handleResize = () => { resizeCanvas(); recenterMouse(); };
    const handleMouseMove = (e: MouseEvent) => { targetMouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseLeave = () => { recenterMouse(); };

    resizeCanvas();
    recenterMouse();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect = influence * mouseInfluence * Math.sin(time * 0.001 + x * 0.01 + wave.offset);
        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.45) +
          mouseEffect;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      time += 1;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      themeColors.wavePalette.forEach(drawWave);
      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#08090f" }}
      role="region"
      aria-label="Hero section"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center md:px-8 lg:px-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ border: "1px solid rgba(0,214,143,0.25)", color: "#00d68f", background: "rgba(0,214,143,0.06)" }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Private beta — limited access
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl font-black tracking-tight md:text-7xl"
            style={{ color: "#eef2f7", lineHeight: 1.05 }}
          >
            Know if your AI is{" "}
            <span className="gradient-text">reliable enough</span> for production.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: "#8b9ab0" }}
          >
            Stabilium gives engineering and compliance teams a single stability
            score — with domain-level diagnostics and release-ready evidence —
            before users feel drift.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group gap-2"
              onClick={() => window.location.href = "/app?mode=register"}
              style={{ boxShadow: "0 0 32px rgba(0,214,143,0.28)" }}
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              Try live demo
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
            style={{ color: "#8b9ab0" }}
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full px-4 py-2"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={statsVariants}
            className="grid gap-4 rounded-2xl p-6 sm:grid-cols-3"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
          >
            {heroStats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em]" style={{ color: "#8b9ab0" }}>
                  {stat.label}
                </div>
                <div className="text-3xl font-black" style={{ color: "#eef2f7" }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
