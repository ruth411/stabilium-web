"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type User = {
  id: string;
  business_name: string;
  email: string;
  created_at: string;
};

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
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
      if (mode === "register") body.business_name = businessName;

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
            <Field label="Company / project name">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-11 rounded-xl px-3 outline-none transition focus:border-[#00d68f]/50"
                style={fieldStyle()}
                required
              />
            </Field>
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

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [runCount, setRunCount] = useState(3);
  const [maxCases, setMaxCases] = useState(20);
  const [seed, setSeed] = useState(42);

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
        body: JSON.stringify({ provider, model, api_key: apiKey, run_count: runCount, max_cases: maxCases, seed }),
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
          <p className="font-bold text-white">{user.business_name} · {user.email}</p>
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
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-3 pr-4">
                    <StatusDot status={job.status} />
                  </td>
                  <td className="py-3 pr-4 capitalize" style={{ color: "#eef2f7" }}>{job.provider}</td>
                  <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#eef2f7" }}>{job.model}</td>
                  <td className="py-3 pr-4 font-bold tabular-nums" style={{ color: job.mean_asi != null ? "#00d68f" : "#8b9ab0" }}>
                    {job.mean_asi != null ? job.mean_asi.toFixed(2) : "—"}
                  </td>
                  <td className="py-3 pr-4" style={{ color: "#8b9ab0" }}>{job.num_cases ?? "—"}</td>
                  <td className="py-3 pr-4 text-xs" style={{ color: "#8b9ab0" }}>{fmtDate(job.created_at)}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => void openReport(job.id)}
                      disabled={job.status !== "completed"}
                      className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5 disabled:opacity-30"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#eef2f7" }}
                    >
                      View report
                    </button>
                  </td>
                </tr>
              ))}
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
        <div style={cardStyle(true)}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">
              Report{" "}
              <span className="mono text-xs font-normal" style={{ color: "#8b9ab0" }}>
                {selectedReport.job_id}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="text-xs transition hover:text-white"
              style={{ color: "#8b9ab0" }}
            >
              Close ✕
            </button>
          </div>
          <pre
            className="overflow-x-auto rounded-xl p-4 text-xs leading-relaxed"
            style={{ background: "rgba(0,0,0,0.3)", color: "#a3e4c9", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {JSON.stringify(selectedReport.report, null, 2)}
          </pre>
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
