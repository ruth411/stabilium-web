"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EvalResult = {
  model: string;
  provider: string;
  asi: number;
  domain_scores: Record<string, number>;
  num_cases: number;
  run_count: number;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const BENCHMARK_RESULTS = [
  {
    model: "gpt-4o-mini",
    provider: "OpenAI",
    asi: 83.9,
    variance: 0.1034,
    mutation: 0.6736,
    domains: { reasoning: 84.8, coding: 83.8, safety: 83.2, planning: 83.5 },
  },
  {
    model: "claude-haiku-4-5",
    provider: "Anthropic",
    asi: 82.4,
    variance: 0.1355,
    mutation: 0.7088,
    domains: { reasoning: 84.2, coding: 82.1, safety: 81.0, planning: 80.5 },
  },
];

const DOMAINS = ["reasoning", "coding", "safety", "planning"] as const;

const STATS = [
  { value: "6", label: "Stability metrics" },
  { value: "100+", label: "Benchmark cases" },
  { value: "3", label: "Supported providers" },
  { value: "1", label: "Unified score" },
];

const PAIN_POINTS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Same prompt, different answers",
    body: "Your AI agent responds differently every time. Users notice. Trust erodes. You have no way to measure it.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: "No standard for AI reliability",
    body: "There is no ISO score, no SLA, no audit trail for how consistently your agent behaves. Procurement asks. You have nothing.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Compliance is coming",
    body: "The EU AI Act requires documentation of high-risk AI systems. SOC 2 auditors are asking about AI controls. 'We tested it manually' is not enough.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect your model",
    body: "Paste your API key and model name. Works with OpenAI, Anthropic, and any provider with a standard chat API.",
  },
  {
    step: "02",
    title: "Run the benchmark",
    body: "Stabilium runs your agent through 100+ curated cases across reasoning, coding, safety, and planning domains.",
  },
  {
    step: "03",
    title: "Get your ASI score",
    body: "Receive a per-domain stability breakdown, a compliance-ready PDF, and a CI/CD badge you can gate deployments on.",
  },
];

const USE_CASES = [
  {
    title: "Pre-deployment certification",
    body: "Run your agent through the benchmark before every release. Gate your CI/CD pipeline on a minimum ASI threshold. Ship with confidence.",
    tag: "CI/CD",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-13.5 0v-1.5A2.25 2.25 0 017.5 10.5m0-3V6a2.25 2.25 0 012.25-2.25h4.5A2.25 2.25 0 0116.5 6v1.5m0 3.75A2.25 2.25 0 0118.75 13.5v1.5" />
      </svg>
    ),
  },
  {
    title: "Model selection",
    body: "Comparing GPT-4o vs Claude vs Gemini? Get objective, side-by-side stability scores across the domains that matter for your use case.",
    tag: "Benchmarking",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Enterprise compliance",
    body: "Generate a signed PDF report showing your AI was evaluated, scored, and approved. Satisfy SOC 2 auditors and EU AI Act requirements.",
    tag: "Compliance",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Regression monitoring",
    body: "Track ASI over time. Get alerted when a model update or prompt change causes your stability score to drop below acceptable levels.",
    tag: "Monitoring",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Try Stabilium with no commitment.",
    features: [
      "25 evaluations / month",
      "1 model",
      "Standard benchmark suite",
      "ASI score + domain breakdown",
      "CSV export",
    ],
    cta: "Join waitlist",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$25",
    period: "/month",
    description: "For teams shipping AI agents to production.",
    features: [
      "Unlimited evaluations",
      "5 models",
      "Custom benchmark cases",
      "Compliance PDF reports",
      "GitHub Action integration",
      "Slack alerts on ASI regression",
    ],
    cta: "Join waitlist",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with compliance requirements.",
    features: [
      "Everything in Pro",
      "REST API access",
      "SSO / SAML",
      "Audit log export",
      "Custom domain benchmarks",
      "Dedicated support",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreColor(score: number) {
  return score >= 85 ? "#34d399" : score >= 75 ? "#facc15" : "#f87171";
}

function ASIGauge({ score }: { score: number }) {
  const color = ScoreColor(score);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#27272a" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-black tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

function DomainBar({ label, score }: { label: string; score: number }) {
  const color = ScoreColor(score);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 capitalize">{label}</span>
        <span className="font-semibold tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function WaitlistForm({ label = "Join the waitlist" }: { label?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        You&apos;re on the list. We&apos;ll be in touch soon.
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="you@company.com"
          className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm transition-all"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-lg shadow-blue-600/20"
        >
          {status === "loading" ? "Saving…" : label}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">Something went wrong. Try again.</p>
      )}
    </div>
  );
}

// ─── Live Demo Component ──────────────────────────────────────────────────────

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-6"],
};

function LiveDemo() {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleProviderChange(p: "openai" | "anthropic") {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0]);
    setResult(null);
    setStatus("idle");
  }

  async function handleRun() {
    if (!apiKey.trim()) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, model, api_key: apiKey, run_count: 3, max_cases: 5 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Evaluation failed");
        setStatus("error");
        return;
      }
      setResult(data as EvalResult);
      setStatus("done");
    } catch {
      setErrorMsg("Could not reach the server. Make sure the backend is running.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
      <div className="grid sm:grid-cols-2 gap-8">
        {/* ── Form ── */}
        <div className="space-y-5">
          {/* Provider toggle */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
              Provider
            </label>
            <div className="flex gap-2">
              {(["openai", "anthropic"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    provider === p
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {p === "openai" ? "OpenAI" : "Anthropic"}
                </button>
              ))}
            </div>
          </div>

          {/* Model select */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            >
              {PROVIDER_MODELS[provider].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
            />
            <p className="text-xs text-zinc-600 mt-2">
              Your key is never stored. It goes directly to your model.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={status === "loading" || !apiKey.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running 5 benchmark cases…
              </span>
            ) : "Run benchmark →"}
          </button>

          {status === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div className="flex flex-col items-center justify-center min-h-[280px]">
          {status === "idle" && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">Your results will appear here</p>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#2563eb" strokeWidth="6"
                    strokeDasharray="60 154" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-blue-400 text-xs font-bold">ASI</span>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-300 text-sm font-medium">Benchmarking {model}</p>
                <p className="text-zinc-600 text-xs">5 cases · 3 runs each · ~30 seconds</p>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="w-full space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-zinc-200">{result.model}</p>
                  <p className="text-xs text-zinc-500">{result.num_cases} cases · {result.run_count} runs</p>
                </div>
                <ASIGauge score={result.asi} />
              </div>
              <div className="space-y-3">
                {Object.entries(result.domain_scores).map(([domain, score]) => (
                  <DomainBar key={domain} label={domain} score={score} />
                ))}
              </div>
              <button
                onClick={() => { setStatus("idle"); setResult(null); setApiKey(""); }}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors"
              >
                Run again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">S</span>
            </div>
            <span className="font-bold text-base tracking-tight">
              stabilium<span className="text-blue-500">.</span>
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm text-zinc-400">
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-zinc-100 transition-colors hidden sm:block"
            >
              How it works
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-zinc-100 transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-600/25"
            >
              Get early access
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-indigo-600/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Now in private beta — limited spots available
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] mb-6">
            Know if your AI agent
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              is reliable before it ships
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stabilium measures the stability of any LLM-powered agent across 100+ benchmark cases.
            One score. Domain-level insights. Compliance-ready reports.
          </p>

          <div className="flex flex-col items-center gap-4">
            <WaitlistForm label="Get early access →" />
            <p className="text-zinc-600 text-xs">No credit card required. Invite-only beta.</p>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800/60 rounded-2xl overflow-hidden border border-zinc-800/60">
            {STATS.map((s) => (
              <div key={s.label} className="bg-zinc-950 px-6 py-5 text-center">
                <div className="text-2xl font-black text-zinc-100 tabular-nums">{s.value}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live benchmark data ── */}
      <section className="py-20 px-6 border-y border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest font-semibold text-zinc-500 mb-2">
              Live benchmark results
            </p>
            <p className="text-zinc-600 text-sm">Run today · 60 cases · 3 runs per case · Balanced profile</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {BENCHMARK_RESULTS.map((r) => (
              <div
                key={r.model}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="font-mono text-sm font-semibold text-zinc-200">{r.model}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{r.provider}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-xs text-zinc-500">ASI Score</p>
                    <ASIGauge score={r.asi} />
                    <p className="text-xs text-zinc-600">/ 100</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {DOMAINS.map((d) => (
                    <DomainBar key={d} label={d} score={r.domains[d]} />
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex gap-4 text-xs text-zinc-500">
                  <span>Variance <span className="text-zinc-300 font-medium">{r.variance.toFixed(4)}</span></span>
                  <span>Mutation Δ <span className="text-zinc-300 font-medium">{r.mutation.toFixed(4)}</span></span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-700 text-xs mt-6">
            ASI = Agent Stability Index (0–100, higher is better) · OpenAI text-embedding-3-small
          </p>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="py-20 px-6 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-500 mb-3">Live demo</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Test your model right now
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Enter your API key and get a real ASI score in under 60 seconds.
              5 benchmark cases, 3 runs each.
            </p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              AI agents are unpredictable.
              <br />
              <span className="text-zinc-600">No one is measuring this.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Every team building on LLMs is flying blind. The same prompt returns different answers.
              You ship it anyway because you have no way to quantify stability.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-zinc-400 mb-5 transition-colors">
                  {p.icon}
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{p.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-500 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              From zero to certified
              <br />
              <span className="text-zinc-500">in under 10 minutes</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mb-16 relative">
            <div className="hidden sm:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700" />
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="relative text-center sm:text-left">
                <div className="inline-flex sm:flex items-center justify-center w-14 h-14 rounded-2xl border border-zinc-700 bg-zinc-900 mb-5 relative z-10">
                  <span className="text-xl font-black text-zinc-500 font-mono">{s.step}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Terminal */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-zinc-500 text-xs font-mono">stabilium — benchmark</span>
            </div>
            <pre className="p-6 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              <span className="text-zinc-600">$ </span>
              <span className="text-blue-400">python3 validate_models.py</span>
              <span className="text-zinc-500"> \{"\n"}    --models gpt-4o-mini claude-haiku-4-5 \{"\n"}    --suite large_suite.json --run-count 3{"\n"}</span>
              <span className="text-zinc-600">{"\n"}  [gpt-4o-mini]      </span>
              <span className="text-emerald-400">████████████████████</span>
              <span className="text-zinc-600"> 60/60  42m{"\n"}  [claude-haiku-4-5] </span>
              <span className="text-emerald-400">████████████████████</span>
              <span className="text-zinc-600"> 60/60  32m{"\n\n"}</span>
              <span className="text-zinc-400">  gpt-4o-mini      ASI </span>
              <span className="text-emerald-400 font-bold">83.9</span>
              <span className="text-zinc-600">  (planning: 83.5, safety: 83.2){"\n"}</span>
              <span className="text-zinc-400">  claude-haiku-4-5 ASI </span>
              <span className="text-yellow-400 font-bold">82.4</span>
              <span className="text-zinc-600">  (planning: 80.5, safety: 81.0){"\n"}</span>
              <span className="text-zinc-600">{"\n"}  Report saved → </span>
              <span className="text-blue-400">out/validation/report.pdf</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-28 px-6 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-500 mb-3">Use cases</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Built for teams
              <br />
              <span className="text-zinc-500">that ship AI</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:bg-blue-600/15 transition-colors">
                    {uc.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-zinc-100">{uc.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 font-medium">{uc.tag}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{uc.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-28 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-500 mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Simple pricing.</h2>
            <p className="text-zinc-400">Cancel anytime. No hidden fees.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 flex flex-col transition-all ${
                  plan.highlight
                    ? "border-blue-500/40 bg-gradient-to-b from-blue-600/8 to-transparent shadow-xl shadow-blue-600/10"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold mb-3">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-zinc-500 text-sm pb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{plan.description}</p>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist CTA ── */}
      <section id="waitlist" className="py-28 px-6 border-t border-zinc-800/60">
        <div className="relative max-w-2xl mx-auto text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-blue-600/5 rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/10 rounded-full blur-2xl" />
          </div>
          <div className="relative border border-zinc-800 rounded-3xl px-8 py-14">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-500 mb-4">Early access</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Get early access
            </h2>
            <p className="text-zinc-400 mb-10 leading-relaxed">
              We&apos;re onboarding teams in private beta. Leave your email and
              we&apos;ll reach out to schedule a setup call.
            </p>
            <div className="flex justify-center">
              <WaitlistForm label="Request access →" />
            </div>
            <p className="text-zinc-600 text-xs mt-5">No spam. No credit card. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-black">S</span>
                </div>
                <span className="font-bold text-zinc-100">
                  stabilium<span className="text-blue-500">.</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                The standard for measuring AI agent reliability. One score. Full transparency.
              </p>
            </div>
            <div className="flex gap-16 text-sm">
              <div className="space-y-3">
                <p className="text-zinc-400 font-semibold">Product</p>
                <div className="space-y-2">
                  <button
                    onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                    className="block text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    How it works
                  </button>
                  <button
                    onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                    className="block text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Pricing
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-zinc-400 font-semibold">Company</p>
                <div className="space-y-2">
                  <a
                    href="https://github.com/ruth411/Stabilium"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    GitHub
                  </a>
                  <a
                    href="mailto:hello@stabilium.io"
                    className="block text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <span>© {new Date().getFullYear()} Stabilium. All rights reserved.</span>
            <span>ASI — Agent Stability Index</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
