"use client";

import { useState } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

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

const PAIN_POINTS = [
  {
    icon: "⚡",
    title: "Same prompt, different answers",
    body: "Your AI agent responds differently every time. Users notice. Trust erodes. You have no way to measure it.",
  },
  {
    icon: "📋",
    title: "No standard for AI reliability",
    body: "There is no ISO score, no SLA, no audit trail for how consistently your agent behaves. Procurement asks. You have nothing.",
  },
  {
    icon: "🇪🇺",
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
    title: "Get your ASI score + report",
    body: "Receive a per-domain stability breakdown, a compliance-ready PDF, and a CI/CD badge you can gate deployments on.",
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

function ASIBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color =
    score >= 85 ? "text-emerald-400" : score >= 75 ? "text-yellow-400" : "text-red-400";
  const sz = size === "sm" ? "text-lg font-bold" : "text-3xl font-bold";
  return <span className={`${color} ${sz} tabular-nums`}>{score.toFixed(1)}</span>;
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
      <p className="text-emerald-400 font-medium text-sm">
        ✓ You&apos;re on the list. We&apos;ll be in touch soon.
      </p>
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
          className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors whitespace-nowrap"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">
            stabilium<span className="text-blue-500">.</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#how-it-works" className="hover:text-zinc-100 transition-colors hidden sm:block">
              How it works
            </a>
            <a href="#pricing" className="hover:text-zinc-100 transition-colors hidden sm:block">
              Pricing
            </a>
            <a
              href="#waitlist"
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Get early access
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-slow" />
            Now in private beta — limited spots available
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Know if your AI agent<br />
            <span className="text-blue-400">is reliable before it ships</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stabilium measures the stability of any LLM-powered agent across 100+ benchmark cases.
            One score. Domain-level insights. Compliance-ready reports.
          </p>
          <div className="flex flex-col items-center gap-4">
            <WaitlistForm label="Get early access →" />
            <p className="text-zinc-600 text-xs">No credit card required. Invite-only beta.</p>
          </div>
        </div>
      </section>

      {/* ── Live benchmark data ── */}
      <section className="py-16 px-6 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-zinc-500 text-xs uppercase tracking-widest font-medium mb-10">
            Live benchmark results — run today, 60 cases, 3 runs per case
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {BENCHMARK_RESULTS.map((r) => (
              <div key={r.model} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm text-zinc-300">{r.model}</p>
                    <p className="text-xs text-zinc-500">{r.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-0.5">ASI Score</p>
                    <span>
                      <ASIBadge score={r.asi} size="md" />
                      <span className="text-zinc-500 text-sm"> / 100</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {DOMAINS.map((d) => (
                    <div key={d} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 capitalize">{d}</span>
                      <ASIBadge score={r.domains[d]} size="sm" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <span>Variance: <span className="text-zinc-300">{r.variance.toFixed(4)}</span></span>
                  <span>Mutation Δ: <span className="text-zinc-300">{r.mutation.toFixed(4)}</span></span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-600 text-xs">
            Balanced profile · OpenAI text-embedding-3-small · ASI = Agent Stability Index (0–100, higher is better)
          </p>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            AI agents are unpredictable.<br />
            <span className="text-zinc-500">No one is measuring this.</span>
          </h2>
          <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">
            Every team building on LLMs is flying blind. The same prompt returns different answers.
            You ship it anyway because you have no way to quantify stability.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                <div className="text-2xl mb-4">{p.icon}</div>
                <h3 className="font-semibold text-zinc-100 mb-2">{p.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Go from zero to a certified stability score in under 10 minutes.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 mb-16">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step}>
                <div className="text-5xl font-black text-zinc-800 mb-4 font-mono">{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Terminal preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-zinc-500 text-xs font-mono">terminal</span>
            </div>
            <pre className="p-6 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              <span className="text-zinc-500">$ </span>
              <span className="text-blue-400">python3 validate_models.py</span>
              <span className="text-zinc-400"> \{"\n"}    --models gpt-4o-mini claude-haiku-4-5 \{"\n"}    --suite large_suite.json --run-count 3{"\n"}</span>
              <span className="text-zinc-500">{"\n"}  [gpt-4o-mini]      </span>
              <span className="text-emerald-400">████████████████████</span>
              <span className="text-zinc-500"> 60/60  42m{"\n"}  [claude-haiku-4-5] </span>
              <span className="text-emerald-400">████████████████████</span>
              <span className="text-zinc-500"> 60/60  32m{"\n\n"}</span>
              <span className="text-zinc-400">  gpt-4o-mini      ASI </span>
              <span className="text-emerald-400 font-bold">83.9</span>
              <span className="text-zinc-500">  (planning: 83.5, safety: 83.2){"\n"}</span>
              <span className="text-zinc-400">  claude-haiku-4-5 ASI </span>
              <span className="text-yellow-400 font-bold">82.4</span>
              <span className="text-zinc-500">  (planning: 80.5, safety: 81.0)</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-24 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Built for teams that ship AI</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Pre-deployment certification",
                body: "Run your agent through the benchmark before every release. Gate your CI/CD pipeline on a minimum ASI threshold. Ship with confidence.",
                tag: "CI/CD",
              },
              {
                title: "Model selection",
                body: "Comparing GPT-4o vs Claude vs Gemini? Get objective, side-by-side stability scores across the domains that matter for your use case.",
                tag: "Benchmarking",
              },
              {
                title: "Enterprise compliance",
                body: "Generate a signed PDF report showing your AI was evaluated, scored, and approved. Satisfy SOC 2 auditors and EU AI Act requirements.",
                tag: "Compliance",
              },
              {
                title: "Regression monitoring",
                body: "Track ASI over time. Get alerted when a model update or prompt change causes your stability score to drop below acceptable levels.",
                tag: "Monitoring",
              },
            ].map((uc) => (
              <div key={uc.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
                  {uc.tag}
                </span>
                <h3 className="font-semibold text-lg mb-2">{uc.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pricing</h2>
            <p className="text-zinc-400">Simple, usage-based pricing. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
                    Most popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
                <ul className="flex-1 space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={`text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist CTA ── */}
      <section id="waitlist" className="py-24 px-6 border-t border-zinc-800">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get early access</h2>
          <p className="text-zinc-400 mb-10">
            We&apos;re onboarding teams in private beta. Leave your email and
            we&apos;ll reach out to schedule a setup call.
          </p>
          <div className="flex justify-center">
            <WaitlistForm label="Request access →" />
          </div>
          <p className="text-zinc-600 text-xs mt-4">No spam. No credit card. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span className="font-bold text-zinc-300">
            stabilium<span className="text-blue-500">.</span>
          </span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/ruth411/Stabilium"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a href="mailto:hello@stabilium.io" className="hover:text-zinc-300 transition-colors">
              Contact
            </a>
          </div>
          <span>© {new Date().getFullYear()} Stabilium. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
