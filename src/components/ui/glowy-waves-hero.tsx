"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const highlightPills = [
  "100+ benchmark cases",
  "Release-ready evidence",
  "7 domains tested",
] as const;

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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 } },
};

export function GlowyWavesHero() {
  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden"
      role="region"
      aria-label="Hero section"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center md:px-8 lg:px-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70 backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Private beta — limited access
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Know if your AI is{" "}
            <span className="bg-gradient-to-r from-primary via-primary/60 to-foreground/80 bg-clip-text text-transparent">
              reliable enough
            </span>{" "}
            for production.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-3xl text-lg text-foreground/70 md:text-2xl"
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
              className="group gap-2 rounded-full px-8 text-base uppercase tracking-[0.2em]"
              onClick={() => (window.location.href = "/app?mode=register")}
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-border/40 bg-background/60 px-8 text-base text-foreground/80 backdrop-blur hover:border-border/60 hover:bg-background/70"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              Try live demo
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/70"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-border/40 bg-background/60 px-4 py-2 backdrop-blur"
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={statsVariants}
            className="grid gap-4 rounded-2xl border border-border/30 bg-background/60 p-6 backdrop-blur-sm sm:grid-cols-3"
          >
            {heroStats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                  {stat.label}
                </div>
                <div className="text-3xl font-semibold text-foreground">
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
