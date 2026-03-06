"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

type JobListResponse = {
  jobs: Job[];
};

type JobReportResponse = {
  job_id: string;
  report: Record<string, unknown>;
};

type AuthMode = "login" | "register";

function fmtDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AppConsolePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [runCount, setRunCount] = useState(3);
  const [maxCases, setMaxCases] = useState(20);
  const [seed, setSeed] = useState(42);

  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedReport, setSelectedReport] = useState<JobReportResponse | null>(null);

  const [loadingSession, setLoadingSession] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [jobBusy, setJobBusy] = useState(false);
  const [jobsBusy, setJobsBusy] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const hasActiveJobs = useMemo(
    () => jobs.some((job) => job.status === "queued" || job.status === "running"),
    [jobs],
  );

  const loadSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setUser(null);
        return;
      }
      setUser(data as User);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    setJobsBusy(true);
    setJobsError(null);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) {
        const error = (data as { error?: string }).error ?? "Could not load jobs";
        setJobsError(error);
        return;
      }
      setJobs((data as JobListResponse).jobs ?? []);
    } catch {
      setJobsError("Could not load jobs");
    } finally {
      setJobsBusy(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) return;
    void loadJobs();
  }, [user, loadJobs]);

  useEffect(() => {
    if (!user) return;
    const intervalMs = hasActiveJobs ? 2500 : 8000;
    const timer = setInterval(() => {
      void loadJobs();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [user, hasActiveJobs, loadJobs]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload: Record<string, string> = {
        email,
        password,
      };
      if (authMode === "register") {
        payload.business_name = businessName;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const error = (data as { error?: string }).error ?? "Authentication failed";
        setAuthError(error);
        return;
      }
      setUser((data as { user: User }).user);
      setPassword("");
    } catch {
      setAuthError("Authentication failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setJobs([]);
    setSelectedReport(null);
  }

  async function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJobBusy(true);
    setJobError(null);
    setSelectedReport(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          api_key: apiKey,
          run_count: runCount,
          max_cases: maxCases,
          seed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const error = (data as { error?: string }).error ?? "Could not create job";
        setJobError(error);
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
        const error = (data as { error?: string }).error ?? "Could not load report";
        setJobError(error);
        return;
      }
      setSelectedReport(data as JobReportResponse);
    } catch {
      setJobError("Could not load report");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10 md:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stabilium Console</h1>
            <p className="text-zinc-400 mt-1">Private async evaluations with per-user reports</p>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4">
            Back to landing
          </Link>
        </header>

        {loadingSession ? (
          <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
            <p className="text-zinc-300">Loading session...</p>
          </section>
        ) : user ? (
          <>
            <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Signed in as</p>
                <p className="font-semibold">{user.business_name} · {user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Logout
              </button>
            </section>

            <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
              <h2 className="text-xl font-semibold mb-4">Run New Evaluation</h2>
              <form onSubmit={submitJob} className="grid gap-4 md:grid-cols-2">
                <label className="text-sm grid gap-2">
                  Provider
                  <select
                    value={provider}
                    onChange={(event) => {
                      const next = event.target.value as "openai" | "anthropic";
                      setProvider(next);
                      setModel(next === "openai" ? "gpt-4o-mini" : "claude-haiku-4-5");
                    }}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>

                <label className="text-sm grid gap-2">
                  Model
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm grid gap-2 md:col-span-2">
                  API Key (one-time use, not stored)
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm grid gap-2">
                  Run count
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={runCount}
                    onChange={(event) => setRunCount(Number(event.target.value) || 1)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm grid gap-2">
                  Max cases
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxCases}
                    onChange={(event) => setMaxCases(Number(event.target.value) || 1)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm grid gap-2">
                  Seed
                  <input
                    type="number"
                    value={seed}
                    onChange={(event) => setSeed(Number(event.target.value) || 0)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>

                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={jobBusy || !apiKey.trim()}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 px-4 py-2 text-sm font-medium"
                  >
                    {jobBusy ? "Submitting..." : "Submit async job"}
                  </button>
                  {jobError ? <span className="text-red-400 text-sm">{jobError}</span> : null}
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Your Jobs</h2>
                <button
                  type="button"
                  onClick={() => void loadJobs()}
                  disabled={jobsBusy}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              {jobsError ? <p className="text-sm text-red-400">{jobsError}</p> : null}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2 pr-4">Provider</th>
                      <th className="text-left py-2 pr-4">Model</th>
                      <th className="text-left py-2 pr-4">ASI</th>
                      <th className="text-left py-2 pr-4">Cases</th>
                      <th className="text-left py-2 pr-4">Created</th>
                      <th className="text-left py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-zinc-900">
                        <td className="py-2 pr-4 capitalize">{job.status}</td>
                        <td className="py-2 pr-4">{job.provider}</td>
                        <td className="py-2 pr-4">{job.model}</td>
                        <td className="py-2 pr-4">{job.mean_asi == null ? "-" : job.mean_asi.toFixed(2)}</td>
                        <td className="py-2 pr-4">{job.num_cases ?? "-"}</td>
                        <td className="py-2 pr-4">{fmtDate(job.created_at)}</td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => void openReport(job.id)}
                            disabled={job.status !== "completed"}
                            className="rounded border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800 disabled:opacity-40"
                          >
                            View report
                          </button>
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 ? (
                      <tr>
                        <td className="py-4 text-zinc-500" colSpan={7}>No jobs yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedReport ? (
              <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40 space-y-3">
                <h2 className="text-xl font-semibold">Report: {selectedReport.job_id}</h2>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(selectedReport.report, null, 2)}
                </pre>
              </section>
            ) : null}
          </>
        ) : (
          <section className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40 max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`px-3 py-1.5 rounded text-sm ${authMode === "login" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`px-3 py-1.5 rounded text-sm ${authMode === "register" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={submitAuth} className="grid gap-3">
              {authMode === "register" ? (
                <label className="text-sm grid gap-2">
                  Business name
                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                    required
                  />
                </label>
              ) : null}

              <label className="text-sm grid gap-2">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                  required
                />
              </label>

              <label className="text-sm grid gap-2">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={authBusy}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 px-4 py-2 text-sm font-medium"
              >
                {authBusy ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}
              </button>
              {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
