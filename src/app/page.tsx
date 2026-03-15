"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { BarChart2, FlaskConical, DollarSign, LogIn } from "lucide-react";

type EvalResult = {
  model: string;
  provider: string;
  asi: number;
  domain_scores: Record<string, number>;
  num_cases: number;
  run_count: number;
};

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Stability Certification",
    body: "Run controlled benchmark suites before each release. Block deploys when ASI drops below your policy threshold.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Model Swap Confidence",
    body: "Compare candidate models side-by-side under identical prompts, mutations, and seeds — before you commit.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Compliance Evidence",
    body: "Generate structured reliability artifacts that support audits, vendor security reviews, and enterprise procurement.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Drift Visibility",
    body: "Track behavior drift week-over-week so your team catches instability before it reaches production users.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Point Stabilium at any OpenAI or Anthropic model with your API key. Keys are used for the run only — never stored.",
  },
  {
    n: "02",
    title: "Benchmark",
    body: "We execute 100+ cases with controlled mutations across 7 domains to stress-test consistency and correctness.",
  },
  {
    n: "03",
    title: "Decide",
    body: "Your ASI score and domain breakdown give you the signal to approve a release, rollback, or investigate further.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    note: "For initial validation",
    points: ["Manual runs", "Core ASI output", "Single workspace"],
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    note: "Per monitored model / month",
    points: ["Async evaluations", "Historical reports", "Provider comparison"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "For security & compliance teams",
    points: ["Dedicated support", "Custom benchmark packs", "Policy integrations"],
    featured: false,
  },
];

const STATS = [
  { value: "100+", label: "benchmark cases" },
  { value: "6", label: "stability metrics" },
  { value: "2+", label: "AI providers" },
  { value: "1", label: "unified score" },
];

function scoreColor(v: number) {
  if (v >= 85) return "#00d68f";
  if (v >= 70) return "#f59e0b";
  return "#ef4444";
}

function Gauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke-dashoffset 1s ease",
          }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
          {score.toFixed(1)}
        </div>
        <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.2em]" style={{ color: "#6b7280" }}>
          ASI
        </div>
      </div>
    </div>
  );
}

function DomainBars({ values }: { values: Record<string, number> }) {
  const entries = Object.entries(values).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map(([domain, score]) => (
        <div key={domain} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="capitalize" style={{ color: "#4b5563" }}>
              {domain}
            </span>
            <span className="mono font-bold" style={{ color: scoreColor(score) }}>
              {score.toFixed(1)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, score))}%`,
                background: scoreColor(score),
                boxShadow: `0 0 8px ${scoreColor(score)}50`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


export default function HomePage() {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [maxCases, setMaxCases] = useState(5);
  const [evalStatus, setEvalStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const heroScore = useMemo(() => result?.asi ?? 83.9, [result]);

  async function runEval(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setEvalStatus("loading");
    setEvalError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, model, api_key: apiKey, run_count: 3, max_cases: maxCases }),
      });
      const data = (await res.json()) as EvalResult | { error?: string };
      if (!res.ok) {
        setEvalStatus("error");
        setEvalError((data as { error?: string }).error ?? "Evaluation failed.");
        return;
      }
      setResult(data as EvalResult);
      setApiKey("");
      setEvalStatus("done");
    } catch {
      setEvalStatus("error");
      setEvalError("Backend unavailable. Please try again.");
    }
  }

  return (
    <div className="min-h-screen">
      {/* Fixed gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-60 -right-60 h-[700px] w-[700px] rounded-full opacity-[0.12] blur-[130px]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-60 -left-60 h-[600px] w-[600px] rounded-full opacity-[0.14] blur-[110px]"
          style={{ background: "radial-gradient(circle, #5b7cf7, transparent 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", background: "rgba(8,9,15,0.7)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-lg font-black tracking-tight text-white">stabilium.</span>
        </Link>

        {/* Expandable tabs — center */}
        <div className="hidden md:block">
          <ExpandableTabs
            activeColor="text-primary"
            className="border-white/10 bg-white/5"
            tabs={[
              { title: "Live demo", icon: FlaskConical },
              { title: "Features", icon: BarChart2 },
              { type: "separator" },
              { title: "Pricing", icon: DollarSign },
              { title: "Sign in", icon: LogIn },
            ]}
            onChange={(i) => {
              if (i === 0) document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
              if (i === 1) document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              if (i === 3) document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              if (i === 4) window.location.href = "/app";
            }}
          />
        </div>

        {/* CTA */}
        <Link href="/app?mode=register" className="btn-primary rounded-lg px-4 py-2 text-sm">
          Get started
        </Link>
      </nav>

      <GlowyWavesHero />

      <main className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        {/* ── Hero placeholder (replaced by GlowyWavesHero above) ── */}
        <section className="hidden">

          {/* Score */}
          <div className="mt-16 flex flex-col items-center gap-3 animate-fade-up-3">
            <Gauge score={heroScore} />
            <p className="mono text-xs uppercase tracking-[0.2em]" style={{ color: "#d4d4d4" }}>
              {result ? `${result.model} · live result` : "sample score"}
            </p>
          </div>

          {/* Stats bar */}
          <div
            className="mt-16 grid grid-cols-2 overflow-hidden rounded-2xl md:grid-cols-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="px-6 py-5 text-center"
                style={{ background: "rgba(8,9,15,0.7)" }}
              >
                <div className="text-3xl font-black tabular-nums" style={{ color: "#6366f1" }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs" style={{ color: "#d4d4d4" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-16">
          <div className="mb-12 text-center">
            <p className="mono mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "#6366f1" }}>
              Capabilities
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "#eef2f7" }}>
              Everything you need to certify AI reliability
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="glow-card rounded-2xl p-6">
                <div className="mb-4" style={{ color: "#6366f1" }}>
                  {f.icon}
                </div>
                <h3 className="mb-2 font-bold" style={{ color: "#111827" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-16">
          <div className="mb-12 text-center">
            <p className="mono mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "#6366f1" }}>
              Process
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "#eef2f7" }}>
              How it works
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <article key={step.n} className="glow-card relative rounded-2xl p-7">
                {i < STEPS.length - 1 && (
                  <span className="absolute -right-2 top-8 hidden text-xl lg:block" style={{ color: "rgba(0,0,0,0.2)" }}>
                    →
                  </span>
                )}
                <p className="mono mb-4 text-4xl font-black opacity-20" style={{ color: "#6366f1" }}>
                  {step.n}
                </p>
                <h3 className="mb-2 text-xl font-bold" style={{ color: "#111827" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Live Demo ── */}
        <section id="demo" className="py-16">
          <div className="mb-12 text-center">
            <p className="mono mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "#6366f1" }}>
              Live demo
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "#eef2f7" }}>
              Run a real benchmark now
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#d4d4d4" }}>
              Free demo runs 10 cases. Sign up for full evaluations up to 100 cases.
            </p>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(16px)" }}>
            <form onSubmit={runEval} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium" style={{ color: "#374151" }}>
                    Provider
                  </span>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const v = e.target.value as "openai" | "anthropic";
                      setProvider(v);
                      setModel(v === "openai" ? "gpt-4o-mini" : "claude-haiku-4-5");
                    }}
                    className="h-11 w-full rounded-xl px-3 text-gray-900 outline-none transition"
                    style={{
                      background: "rgba(0,0,0,0.05)",
                      border: "1px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium" style={{ color: "#374151" }}>
                    Model
                  </span>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-11 w-full rounded-xl px-3 text-gray-900 outline-none transition"
                    style={{
                      background: "rgba(0,0,0,0.05)",
                      border: "1px solid rgba(0,0,0,0.12)",
                    }}
                    required
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-2 block font-medium" style={{ color: "#374151" }}>
                  API key (one-time, not stored)
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="h-11 w-full rounded-xl px-3 text-gray-900 outline-none transition"
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                  required
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: "#374151" }}>
                    Number of cases
                  </span>
                  <span className="mono font-bold" style={{ color: "#6366f1" }}>
                    {maxCases}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxCases}
                  onChange={(e) => setMaxCases(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#6366f1]"
                />
                <div className="flex justify-between text-xs" style={{ color: "#6b7280" }}>
                  <span>1</span>
                  <span>5</span>
                  <span>10 (max free)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={evalStatus === "loading" || !apiKey.trim()}
                className="btn-primary h-12 w-full rounded-xl text-sm"
              >
                {evalStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="animate-spin h-3.5 w-3.5 rounded-full border-2"
                      style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }}
                    />
                    Running benchmark…
                  </span>
                ) : (
                  "Run benchmark →"
                )}
              </button>
            </form>

            {(evalStatus === "error" || result) && (
              <div
                className="mt-6 rounded-xl p-5"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                {evalStatus === "error" && evalError && (
                  <p className="text-sm text-red-500">{evalError}</p>
                )}
                {result && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold" style={{ color: "#111827" }}>{result.model}</p>
                        <p className="mono mt-0.5 text-xs" style={{ color: "#6b7280" }}>
                          {result.num_cases} cases · {result.run_count} runs
                        </p>
                      </div>
                      <Gauge score={result.asi} />
                    </div>
                    <DomainBars values={result.domain_scores} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-16">
          <div className="mb-12 text-center">
            <p className="mono mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "#6366f1" }}>
              Pricing
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "#eef2f7" }}>
              Simple, transparent pricing
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <article
                key={plan.name}
                className="relative rounded-2xl p-7"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  border: plan.featured
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: plan.featured ? "0 0 48px rgba(99,102,241,0.14)" : undefined,
                }}
              >
                {plan.featured && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-lg font-bold" style={{ color: "#111827" }}>{plan.name}</h3>
                <p className="mt-1 text-xs" style={{ color: "#6b7280" }}>
                  {plan.note}
                </p>
                <p
                  className="mt-6 text-5xl font-black tracking-tight"
                  style={{ color: plan.featured ? "#6366f1" : "#111827" }}
                >
                  {plan.price}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {plan.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm" style={{ color: "#4b5563" }}>
                      <span style={{ color: "#6366f1" }}>✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === "Custom" ? "mailto:hello@stabilium.io" : "/app?mode=register"}
                  className={`mt-8 flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition ${plan.featured ? "btn-primary" : "hover:bg-black/5"}`}
                  style={
                    plan.featured
                      ? undefined
                      : { border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }
                  }
                >
                  {plan.price === "Custom" ? "Contact us" : "Get started"}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 pb-24">
          <div
            className="rounded-3xl p-10 text-center md:p-16"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 0 80px rgba(99,102,241,0.08)",
            }}
          >
            <p className="mono mb-4 text-xs uppercase tracking-[0.2em]" style={{ color: "#6366f1" }}>
              Start today
            </p>
            <h2 className="mb-4 text-4xl font-black tracking-tight" style={{ color: "#eef2f7" }}>
              Ready to certify your AI?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed" style={{ color: "#d4d4d4" }}>
              Create a free account and run your first benchmark in minutes. No credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/app?mode=register"
                className="btn-primary inline-flex h-12 items-center rounded-xl px-10 text-sm"
                style={{ boxShadow: "0 0 32px rgba(99,102,241,0.25)" }}
              >
                Create free account →
              </Link>
              <Link
                href="/app"
                className="inline-flex h-12 items-center rounded-xl px-8 text-sm font-semibold text-white transition hover:bg-white/5"
                style={{ border: "1px solid rgba(0,0,0,0.12)" }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 md:px-12"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,9,15,0.7)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            <span className="text-sm font-black tracking-tight text-white">stabilium.</span>
          </div>
          <p className="text-xs" style={{ color: "#d4d4d4" }}>
            © {new Date().getFullYear()} Stabilium — AI reliability infrastructure.
          </p>
        </div>
      </footer>
    </div>
  );
}
