"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type EvalResult = {
  model: string;
  provider: string;
  asi: number;
  domain_scores: Record<string, number>;
  num_cases: number;
  run_count: number;
};

const TRUST_POINTS = [
  "Runs against 100+ benchmark cases",
  "OpenAI + Anthropic adapters",
  "Per-domain ASI scoring",
  "Async jobs with report history",
];

const CAPABILITIES = [
  {
    title: "Stability Certification",
    body: "Run controlled benchmark suites before each release and block deploys when ASI drops below policy thresholds.",
  },
  {
    title: "Model Swap Confidence",
    body: "Compare candidate models side-by-side under identical prompts, mutations, and seeds before migration decisions.",
  },
  {
    title: "Compliance Evidence",
    body: "Generate structured reliability artifacts that support audits, vendor security reviews, and enterprise procurement.",
  },
  {
    title: "Drift Visibility",
    body: "Track behavior drift week-over-week so your team catches instability before it reaches production users.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Connect",
    detail: "Use your own model API key for one-time runs. Keys are never persisted.",
  },
  {
    step: "02",
    title: "Benchmark",
    detail: "Stabilium executes multi-case, multi-run evaluations with deterministic settings.",
  },
  {
    step: "03",
    title: "Decide",
    detail: "Use ASI and domain breakdowns to approve, rollback, or iterate with confidence.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    note: "For initial validation",
    points: ["Manual runs", "Core ASI output", "Single workspace"],
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
    note: "Security and compliance teams",
    points: ["Dedicated support", "Custom benchmark packs", "Policy integrations"],
  },
];

function scoreColor(score: number): string {
  if (score >= 85) return "#1f9d73";
  if (score >= 75) return "#da8d16";
  return "#c4473b";
}

function Gauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const style = {
    background: `conic-gradient(${color} ${score * 3.6}deg, #d8e1dc ${score * 3.6}deg 360deg)`,
  };

  return (
    <div className="relative inline-flex h-28 w-28 items-center justify-center rounded-full p-1" style={style}>
      <div className="absolute inset-2 rounded-full bg-white" />
      <div className="relative text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          {score.toFixed(1)}
        </div>
        <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">ASI</div>
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
            <span className="capitalize text-[var(--text-muted)]">{domain}</span>
            <span className="mono font-semibold" style={{ color: scoreColor(score) }}>
              {score.toFixed(1)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: scoreColor(score) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitlistInline() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "success" : "error");
      if (response.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        required
        placeholder="work email"
        className="h-11 flex-1 rounded-xl border border-[var(--line)] bg-white px-4 text-sm outline-none focus:border-[var(--brand)]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting..." : "Join waitlist"}
      </button>
      {status === "success" ? <p className="text-xs text-[var(--brand-ink)]">You&apos;re in.</p> : null}
      {status === "error" ? <p className="text-xs text-[#b83b2f]">Could not submit right now.</p> : null}
    </form>
  );
}

export default function HomePage() {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headingScore = useMemo(() => result?.asi ?? 83.9, [result]);

  async function runLiveEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey.trim()) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          api_key: apiKey,
          run_count: 3,
          max_cases: 5,
        }),
      });

      const payload = (await response.json()) as EvalResult | { error?: string };
      if (!response.ok) {
        const message = (payload as { error?: string }).error ?? "Evaluation failed.";
        setStatus("error");
        setError(message);
        return;
      }

      setResult(payload as EvalResult);
      setApiKey("");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Backend unavailable. Please try again.");
    }
  }

  return (
    <main className="relative overflow-hidden px-6 pb-20 pt-8 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#c3e5db]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#b6caec]/45 blur-3xl" />

      <div className="mx-auto max-w-7xl space-y-16">
        <header className="animate-fade-in flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/85 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent)] text-white grid place-items-center mono text-xs">S</div>
            <div>
              <div className="mono text-[11px] tracking-[0.2em] text-[var(--text-muted)]">STABILIUM</div>
              <div className="text-sm font-semibold">AI Reliability Infrastructure</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-strong)]">
              Open app
            </Link>
            <a href="#waitlist" className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110">
              Join waitlist
            </a>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="animate-fade-in space-y-6">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-3 py-1 mono text-[11px] tracking-[0.16em] text-[var(--text-muted)]">
              Continuous AI Stability Validation
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--text)] md:text-6xl">
              The reliability control plane for production AI agents.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-muted)]">
              Stabilium gives engineering and compliance teams a defensible stability score, domain-level diagnostics,
              and release-ready evidence before users feel drift.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="glass rounded-xl px-4 py-3 text-sm text-[var(--text-muted)]">
                  {point}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Gauge score={headingScore} />
              <div>
                <p className="mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Current sample score</p>
                <p className="text-2xl font-bold text-[var(--text)]">{headingScore.toFixed(1)} ASI</p>
                <p className="text-sm text-[var(--text-muted)]">Based on the same benchmark methodology used in CI runs.</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-delay glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Live Reliability Sandbox</h2>
              <span className="mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Real run</span>
            </div>

            <form onSubmit={runLiveEvaluation} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-muted)]">Provider</span>
                  <select
                    value={provider}
                    onChange={(event) => {
                      const next = event.target.value as "openai" | "anthropic";
                      setProvider(next);
                      setModel(next === "openai" ? "gpt-4o-mini" : "claude-haiku-4-5");
                    }}
                    className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-muted)]">Model</span>
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                    required
                  />
                </label>
              </div>

              <label className="text-sm block">
                <span className="mb-1 block text-[var(--text-muted)]">API key (one-time run, not stored)</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                  placeholder="sk-..."
                  required
                />
              </label>

              <button
                type="submit"
                disabled={status === "loading" || !apiKey.trim()}
                className="h-11 w-full rounded-lg bg-[var(--accent)] text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {status === "loading" ? "Running benchmark..." : "Run benchmark"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4">
              {status === "error" && error ? <p className="text-sm text-[#b83b2f]">{error}</p> : null}
              {result ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text)]">{result.model}</p>
                    <p className="mono text-xs text-[var(--text-muted)]">
                      {result.num_cases} cases · {result.run_count} runs
                    </p>
                  </div>
                  <DomainBars values={result.domain_scores} />
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Run a live sample to see domain-level ASI output.</p>
              )}
            </div>
          </div>
        </section>

        <section className="animate-fade-in-delay grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="glass rounded-2xl p-5">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="animate-fade-in-delay-2 grid gap-4 lg:grid-cols-3">
          {PROCESS.map((item) => (
            <article key={item.step} className="glass rounded-2xl p-5">
              <p className="mono text-xs tracking-[0.2em] text-[var(--brand-ink)]">STEP {item.step}</p>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {PRICING.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.featured
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.featured ? "text-white/80" : "text-[var(--text-muted)]"}`}>{plan.note}</p>
              <p className="mt-5 text-4xl font-black tracking-tight">{plan.price}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.points.map((point) => (
                  <li key={point} className={plan.featured ? "text-white/90" : "text-[var(--text-muted)]"}>
                    • {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section id="waitlist" className="glass rounded-3xl p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.2em] text-[var(--brand-ink)]">Early access</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Get invited to the private beta</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                Join engineering teams using Stabilium to enforce reliability standards before AI changes reach production.
              </p>
            </div>
            <div className="md:w-[360px]">
              <WaitlistInline />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
