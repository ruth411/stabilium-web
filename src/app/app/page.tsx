"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type User = {
  id: string;
  name: string;
  business_name: string;
  email: string;
  created_at: string;
};

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  provider: string;
  model: string;
  run_count: number;
  max_cases: number;
  seed: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  mean_asi: number | null;
  num_cases: number | null;
  completed_cases: number;
};

type JobListResponse = { jobs: Job[] };
type JobReportResponse = { job_id: string; report: Record<string, unknown> };
type AuthMode = "login" | "register";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusColor(s: Job["status"]) {
  if (s === "completed") return "#00d68f";
  if (s === "running") return "#f59e0b";
  if (s === "failed") return "#ef4444";
  if (s === "cancelled") return "#6b7280";
  return "#8b9ab0";
}

function StatusDot({ status }: { status: Job["status"] }) {
  return (
    <span className="flex items-center gap-1.5 capitalize text-sm" style={{ color: statusColor(status) }}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: statusColor(status),
          boxShadow: status === "running" ? `0 0 6px ${statusColor(status)}` : undefined,
          animation: status === "running" ? "pulse 1.5s ease-in-out infinite" : undefined,
        }}
      />
      {status}
    </span>
  );
}

function fieldStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#eef2f7",
  } as React.CSSProperties;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: "#8b9ab0" }}>{label}</span>
      {children}
    </label>
  );
}

function cardStyle(featured = false): React.CSSProperties {
  return {
    background: featured ? "rgba(0,214,143,0.05)" : "rgba(255,255,255,0.03)",
    border: featured ? "1px solid rgba(0,214,143,0.2)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1rem",
    padding: "1.5rem",
  };
}

// ── Auth form ────────────────────────────────────────────────────────────────

function AuthPanel({ initialMode, onAuth }: { initialMode: AuthMode; onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: Record<string, string> = { email, password };
      if (mode === "register") {
        body.name = name;
        body.business_name = businessName;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Authentication failed");
        return;
      }
      onAuth((data as { user: User }).user);
    } catch {
      setError("Could not reach server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <div className="w-full max-w-sm" style={cardStyle()}>
        {/* Mode toggle */}
        <div className="mb-6 flex rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className="flex-1 py-2.5 text-sm font-semibold capitalize transition"
              style={
                mode === m
                  ? { background: "rgba(0,214,143,0.12)", color: "#00d68f" }
                  : { color: "#8b9ab0" }
              }
            >
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <h1 className="mb-6 text-xl font-black" style={{ color: "#eef2f7" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <>
              <Field label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="h-11 rounded-xl px-3 outline-none transition focus:border-[#00d68f]/50"
                  style={fieldStyle()}
                  required
                />
              </Field>
              <Field label="Company / project name">
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-11 rounded-xl px-3 outline-none transition focus:border-[#00d68f]/50"
                  style={fieldStyle()}
                  required
                />
              </Field>
            </>
          )}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl px-3 outline-none transition focus:border-[#00d68f]/50"
              style={fieldStyle()}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl px-3 outline-none transition focus:border-[#00d68f]/50"
              style={fieldStyle()}
              required
              minLength={8}
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-1 h-11 rounded-xl text-sm"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs" style={{ color: "#8b9ab0" }}>
          {mode === "login" ? "No account?" : "Already have one?"}{" "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
            style={{ color: "#00d68f" }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Report view ──────────────────────────────────────────────────────────────

type AsiStatistics = {
  mean?: number;
  ci_low?: number;
  ci_high?: number;
  std?: number;
  n?: number;
};

// ASI is on a 0–100 scale (see agent_stability_engine/report/schema.py)
function asiColor(score: number): string {
  if (score >= 85) return "#00d68f";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

function asiLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs work";
}

function ReportView({ data }: { data: Record<string, unknown> }) {
  // Failure report
  if (data.report_type === "job_failure") {
    const reason = typeof data.failure_reason === "string" ? data.failure_reason : "Unknown error";
    const completed = typeof data.completed_cases === "number" ? data.completed_cases : null;
    const total = typeof data.total_cases === "number" ? data.total_cases : null;
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span className="mt-0.5 text-lg">⚠</span>
          <div>
            <p className="font-bold" style={{ color: "#ef4444" }}>Evaluation failed</p>
            <p className="mt-1 font-mono text-sm" style={{ color: "#fca5a5" }}>{reason}</p>
          </div>
        </div>
        {completed != null && total != null && (
          <p className="text-sm" style={{ color: "#8b9ab0" }}>
            {completed} of {total} cases completed before failure.
          </p>
        )}
        <p className="text-xs" style={{ color: "#8b9ab0" }}>
          Check your API key and model name, then submit a new evaluation.
        </p>
      </div>
    );
  }

  // ASI is 0–100
  const mean_asi = typeof data.mean_asi === "number" ? data.mean_asi : null;
  const domain_scores =
    data.domain_scores && typeof data.domain_scores === "object"
      ? (data.domain_scores as Record<string, number>)
      : {};
  const asi_statistics =
    data.asi_statistics && typeof data.asi_statistics === "object"
      ? (data.asi_statistics as AsiStatistics)
      : null;
  const num_cases = typeof data.num_cases === "number" ? data.num_cases : null;
  const run_count = typeof data.run_count === "number" ? data.run_count : null;
  const suite_name = typeof data.suite_name === "string" ? data.suite_name : "—";
  const benchmark_id = typeof data.benchmark_id === "string" ? data.benchmark_id : "—";

  const color = mean_asi != null ? asiColor(mean_asi) : "#8b9ab0";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // score is 0–100, so fraction = score/100
  const dashOffset = mean_asi != null ? circumference * (1 - mean_asi / 100) : circumference;

  return (
    <div className="space-y-6">
      {/* Top row: gauge + stats */}
      <div className="flex flex-wrap gap-6">
        {/* Circular gauge */}
        <div className="flex flex-col items-center gap-3">
          <svg width="148" height="148" viewBox="0 0 148 148">
            {/* Track */}
            <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            {/* Arc */}
            <circle
              cx="74" cy="74" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 74 74)"
              style={{ filter: `drop-shadow(0 0 10px ${color}88)`, transition: "stroke-dashoffset 1s ease" }}
            />
            {/* Score */}
            <text x="74" y="68" textAnchor="middle" fill={color} fontSize="28" fontWeight="900" fontFamily="monospace">
              {mean_asi != null ? mean_asi.toFixed(1) : "—"}
            </text>
            <text x="74" y="86" textAnchor="middle" fill="#8b9ab0" fontSize="11" fontFamily="sans-serif">
              ASI score
            </text>
          </svg>
          {mean_asi != null && (
            <span
              className="rounded-full px-4 py-1 text-xs font-bold tracking-wide"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
            >
              {asiLabel(mean_asi)}
            </span>
          )}
        </div>

        {/* Stat cards */}
        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cases run", value: String(num_cases ?? "—") },
              { label: "Runs / case", value: String(run_count ?? "—") },
              { label: "Suite", value: suite_name },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="mb-1 text-xs" style={{ color: "#8b9ab0" }}>{label}</p>
                <p className="truncate text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Confidence interval */}
          {asi_statistics && typeof asi_statistics.ci_low === "number" && typeof asi_statistics.ci_high === "number" && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="mb-3 text-xs font-medium" style={{ color: "#8b9ab0" }}>95% confidence interval</p>
              <div className="flex items-center gap-3">
                <span className="mono w-12 text-right text-sm font-bold" style={{ color }}>
                  {asi_statistics.ci_low.toFixed(1)}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  {/* CI range band */}
                  <div
                    className="absolute inset-y-0 rounded-full opacity-30"
                    style={{
                      left: `${asi_statistics.ci_low}%`,
                      right: `${100 - asi_statistics.ci_high}%`,
                      background: color,
                    }}
                  />
                  {/* Mean marker */}
                  <div
                    className="absolute inset-y-0 w-1 rounded-full"
                    style={{ left: `${mean_asi ?? 0}%`, transform: "translateX(-50%)", background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                </div>
                <span className="mono w-12 text-sm font-bold" style={{ color }}>
                  {asi_statistics.ci_high.toFixed(1)}
                </span>
              </div>
              {typeof asi_statistics.std === "number" && (
                <p className="mt-2 text-xs" style={{ color: "#8b9ab0" }}>
                  σ&nbsp;=&nbsp;{asi_statistics.std.toFixed(2)}&ensp;·&ensp;n&nbsp;=&nbsp;{asi_statistics.n ?? "—"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Domain breakdown */}
      {Object.keys(domain_scores).length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold" style={{ color: "#8b9ab0", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.7rem" }}>Domain breakdown</h3>
          <div className="space-y-3">
            {Object.entries(domain_scores).map(([domain, score]) => (
              <div key={domain} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs capitalize" style={{ color: "#eef2f7" }}>
                  {domain.replace(/_/g, " ")}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    data-domain-bar
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: asiColor(score), boxShadow: `0 0 6px ${asiColor(score)}88` }}
                  />
                </div>
                <span className="mono w-10 text-right text-xs font-bold" style={{ color: asiColor(score) }}>
                  {score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="border-t pt-4 text-xs" style={{ color: "#8b9ab0", borderColor: "rgba(255,255,255,0.06)" }}>
        Benchmark ID &nbsp;<span className="mono" style={{ color: "#5b7cf7" }}>{benchmark_id}</span>
      </p>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [runCount, setRunCount] = useState(3);
  const [maxCases, setMaxCases] = useState(20);
  const [seed, setSeed] = useState(42);
  const [workers, setWorkers] = useState(3);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedReport, setSelectedReport] = useState<JobReportResponse | null>(null);

  const [jobBusy, setJobBusy] = useState(false);
  const [jobsBusy, setJobsBusy] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const hasActive = useMemo(
    () => jobs.some((j) => j.status === "queued" || j.status === "running"),
    [jobs],
  );

  const loadJobs = useCallback(async () => {
    setJobsBusy(true);
    setJobsError(null);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) {
        setJobsError((data as { error?: string }).error ?? "Could not load jobs");
        return;
      }
      setJobs((data as JobListResponse).jobs ?? []);
    } catch {
      setJobsError("Could not load jobs");
    } finally {
      setJobsBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const ms = hasActive ? 2500 : 8000;
    const t = setInterval(() => void loadJobs(), ms);
    return () => clearInterval(t);
  }, [hasActive, loadJobs]);

  async function submitJob(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setJobBusy(true);
    setJobError(null);
    setSelectedReport(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, model, api_key: apiKey, run_count: runCount, max_cases: maxCases, seed, workers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJobError((data as { error?: string }).error ?? "Could not create job");
        return;
      }
      setApiKey("");
      await loadJobs();
    } catch {
      setJobError("Could not create job");
    } finally {
      setJobBusy(false);
    }
  }

  async function cancelJob(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) await loadJobs();
    } catch {
      // silently ignore — the polling loop will update the status
    }
  }

  async function openReport(jobId: string) {
    setJobError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`);
      const data = await res.json();
      if (!res.ok) {
        setJobError((data as { error?: string }).error ?? "Could not load report");
        return;
      }
      setSelectedReport(data as JobReportResponse);
    } catch {
      setJobError("Could not load report");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 md:px-10">
      {/* User bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4"
        style={cardStyle()}
      >
        <div>
          <p className="text-xs" style={{ color: "#8b9ab0" }}>Signed in as</p>
          <p className="font-bold text-white">
            {user.name || user.business_name}
            <span className="ml-2 text-sm font-normal" style={{ color: "#8b9ab0" }}>
              · {user.business_name} · {user.email}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Sign out
        </button>
      </div>

      {/* New job form */}
      <div style={cardStyle()}>
        <h2 className="mb-5 text-lg font-bold text-white">Run new evaluation</h2>
        <form onSubmit={submitJob} className="grid gap-4 md:grid-cols-2">
          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => {
                const v = e.target.value as "openai" | "anthropic";
                setProvider(v);
                setModel(v === "openai" ? "gpt-4o-mini" : "claude-haiku-4-5");
              }}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </Field>

          <Field label="Model">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
              required
            />
          </Field>

          <Field label="API key (one-time use, not stored)">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="h-11 rounded-xl px-3 outline-none"
              style={{ ...fieldStyle(), gridColumn: "1 / -1" } as React.CSSProperties}
              required
            />
          </Field>

          <Field label="Run count (1–10)">
            <input
              type="number"
              min={1}
              max={10}
              value={runCount}
              onChange={(e) => setRunCount(Number(e.target.value) || 1)}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
              required
            />
          </Field>

          <Field label="Max cases (1–100)">
            <input
              type="number"
              min={1}
              max={100}
              value={maxCases}
              onChange={(e) => setMaxCases(Number(e.target.value) || 1)}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
              required
            />
          </Field>

          <Field label="Seed">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
              required
            />
          </Field>

          <Field label="Parallel workers (speed vs rate-limit trade-off)">
            <select
              value={workers}
              onChange={(e) => setWorkers(Number(e.target.value))}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()}
            >
              <option value={1}>1 — sequential (slowest, safest)</option>
              <option value={2}>2 — 2× faster</option>
              <option value={3}>3 — 3× faster (recommended)</option>
              <option value={5}>5 — 5× faster</option>
              <option value={10}>10 — 10× faster (high API usage)</option>
            </select>
          </Field>

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={jobBusy || !apiKey.trim()}
              className="btn-primary h-11 rounded-xl px-7 text-sm"
            >
              {jobBusy ? "Submitting…" : "Submit evaluation →"}
            </button>
            {jobError && <p className="text-sm text-red-400">{jobError}</p>}
          </div>
        </form>
      </div>

      {/* Jobs table */}
      <div style={cardStyle()}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Your evaluations</h2>
          <button
            type="button"
            onClick={() => void loadJobs()}
            disabled={jobsBusy}
            className="rounded-xl px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Refresh
          </button>
        </div>

        {jobsError && <p className="mb-4 text-sm text-red-400">{jobsError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Status", "Provider", "Model", "ASI", "Cases", "Created", ""].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-left text-xs font-medium" style={{ color: "#8b9ab0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isActive = job.status === "running" || job.status === "queued";
                const isFailed = job.status === "failed";
                const pct = job.status === "running" && job.max_cases > 0
                  ? Math.min(100, Math.round((job.completed_cases / job.max_cases) * 100))
                  : 0;
                return (
                  <React.Fragment key={job.id}>
                    <tr style={{ borderBottom: (isActive || isFailed) ? undefined : "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-3 pr-4">
                        <StatusDot status={job.status} />
                      </td>
                      <td className="py-3 pr-4 capitalize" style={{ color: "#eef2f7" }}>{job.provider}</td>
                      <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#eef2f7" }}>{job.model}</td>
                      <td className="py-3 pr-4 font-bold tabular-nums" style={{ color: job.mean_asi != null ? "#00d68f" : "#8b9ab0" }}>
                        {job.mean_asi != null ? job.mean_asi.toFixed(2) : "—"}
                      </td>
                      <td className="py-3 pr-4 tabular-nums" style={{ color: "#8b9ab0" }}>
                        {job.status === "running"
                          ? <span><span style={{ color: "#00d68f" }}>{job.completed_cases}</span> / {job.max_cases}</span>
                          : (job.num_cases ?? "—")}
                      </td>
                      <td className="py-3 pr-4 text-xs" style={{ color: "#8b9ab0" }}>{fmtDate(job.created_at)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => void cancelJob(job.id)}
                              className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5"
                              style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                            >
                              Stop
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void openReport(job.id)}
                            disabled={job.status !== "completed" && job.status !== "failed"}
                            className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5 disabled:opacity-30"
                            style={{
                              border: isFailed ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
                              color: isFailed ? "#ef4444" : "#eef2f7",
                            }}
                          >
                            {isFailed ? "View error" : "View report"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isActive && (
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td colSpan={7} className="pb-3 pt-0">
                          {/* Progress bar */}
                          <div
                            className="relative overflow-hidden rounded-full"
                            style={{ height: "6px", background: "rgba(255,255,255,0.06)" }}
                          >
                            {job.status === "running" ? (
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: "linear-gradient(90deg, #00d68f, #00b87a)",
                                  boxShadow: "0 0 8px #00d68f88",
                                  minWidth: pct > 0 ? undefined : "0%",
                                }}
                              />
                            ) : (
                              /* Queued: indeterminate shimmer */
                              <div
                                className="absolute inset-y-0 w-1/4 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.18)",
                                  animation: "progress-shimmer 1.6s ease-in-out infinite",
                                }}
                              />
                            )}
                          </div>
                          {/* Label */}
                          <p className="mt-1 text-xs" style={{ color: "#8b9ab0" }}>
                            {job.status === "running"
                              ? `${job.completed_cases} of ${job.max_cases} cases complete · ${pct}%`
                              : "Queued — waiting to start…"}
                          </p>
                        </td>
                      </tr>
                    )}
                    {isFailed && job.error_message && (
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td colSpan={7} className="pb-3 pt-0">
                          <p className="mt-1 rounded-lg px-3 py-2 font-mono text-xs" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}>
                            {job.error_message}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td className="py-8 text-sm" colSpan={7} style={{ color: "#8b9ab0" }}>
                    No evaluations yet. Submit your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report panel */}
      {selectedReport && (
        <div data-print-report style={cardStyle(true)}>
          <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-white">
              {selectedReport.report.report_type === "job_failure" ? "Evaluation Error" : "Stability Report"}{" "}
              <span className="mono text-xs font-normal" style={{ color: "#8b9ab0" }}>
                {selectedReport.job_id}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                style={{ background: "rgba(0,214,143,0.12)", border: "1px solid rgba(0,214,143,0.3)", color: "#00d68f" }}
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium transition hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8b9ab0" }}
              >
                Close ✕
              </button>
            </div>
          </div>
          <ReportView data={selectedReport.report} />
        </div>
      )}
    </div>
  );
}

// ── Page shell ───────────────────────────────────────────────────────────────

function AppPageInner() {
  const params = useSearchParams();
  const initialMode: AuthMode = params.get("mode") === "register" ? "register" : "login";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) setUser((await res.json()) as User);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "#08090f" }}>
      {/* Gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-60 -right-60 h-[500px] w-[500px] rounded-full opacity-[0.12] blur-[100px]"
          style={{ background: "radial-gradient(circle, #00d68f, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.1] blur-[90px]"
          style={{ background: "radial-gradient(circle, #5b7cf7, transparent 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 py-4 md:px-10"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div
            className="mono grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-black"
            style={{ background: "linear-gradient(135deg, #00d68f, #00a06a)" }}
          >
            S
          </div>
          <span className="font-bold text-white">Stabilium</span>
        </Link>
        {user && (
          <p className="text-xs" style={{ color: "#8b9ab0" }}>
            {user.email}
          </p>
        )}
      </nav>

      <div className="relative z-10">
        {loading ? (
          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
            <div
              className="animate-spin h-8 w-8 rounded-full border-2"
              style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#00d68f" }}
            />
          </div>
        ) : user ? (
          <Dashboard user={user} onLogout={logout} />
        ) : (
          <AuthPanel initialMode={initialMode} onAuth={setUser} />
        )}
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense>
      <AppPageInner />
    </Suspense>
  );
}
