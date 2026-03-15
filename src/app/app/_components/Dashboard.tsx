"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Job, JobListResponse, JobReportResponse, User } from "../_types";
import { cardStyle } from "../_types";
import type { JobFormData } from "./JobForm";
import { JobForm } from "./JobForm";
import { JobsTable } from "./JobsTable";
import { ReportView } from "./ReportView";

type DashboardProps = {
  user: User;
  onLogout: () => void;
};

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedReport, setSelectedReport] = useState<JobReportResponse | null>(null);

  const [jobBusy, setJobBusy] = useState(false);
  const [jobsBusy, setJobsBusy] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const hasActive = useMemo(
    () => jobs.some((j) => j.status === "queued" || j.status === "running"),
    [jobs],
  );

  const loadJobs = useCallback(async (signal?: AbortSignal) => {
    setJobsBusy(true);
    setJobsError(null);
    try {
      const res = await fetch("/api/jobs", { signal });
      const data = await res.json();
      if (!res.ok) {
        setJobsError((data as { error?: string }).error ?? "Could not load jobs");
        return;
      }
      setJobs((data as JobListResponse).jobs ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setJobsError("Could not load jobs");
    } finally {
      setJobsBusy(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs]);

  useEffect(() => {
    const ms = hasActive ? 2500 : 8000;
    const t = setInterval(() => {
      const controller = new AbortController();
      void loadJobs(controller.signal);
    }, ms);
    return () => clearInterval(t);
  }, [hasActive, loadJobs]);

  async function handleJobSubmit(data: JobFormData) {
    setJobBusy(true);
    setJobError(null);
    setSelectedReport(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: data.provider,
          model: data.model,
          api_key: data.apiKey,
          run_count: data.runCount,
          max_cases: data.maxCases,
          seed: data.seed,
          workers: data.workers,
          job_type: data.jobType,
          suite: data.jobType === "benchmark"
            ? "examples/benchmarks/large_suite.json"
            : data.jobType === "conversation_benchmark"
              ? "examples/benchmarks/conversation_suite.json"
              : "examples/agent_tasks/sample_tasks.json",
          fault_rate: data.jobType === "agent_benchmark" ? data.faultRate : 0,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setJobError((resData as { error?: string }).error ?? "Could not create job");
        return;
      }
      await loadJobs();
    } catch {
      setJobError("Could not create job");
    } finally {
      setJobBusy(false);
    }
  }

  async function resendVerification() {
    setResendBusy(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      setResendDone(true);
    } finally {
      setResendBusy(false);
    }
  }

  async function cancelJob(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) await loadJobs();
    } catch {
      // polling loop will update status
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4" style={cardStyle()}>
        <div>
          <p className="text-xs" style={{ color: "#d4d4d4" }}>Signed in as</p>
          <p className="font-bold text-white">
            {user.name || user.business_name}
            <span className="ml-2 text-sm font-normal" style={{ color: "#d4d4d4" }}>
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

      {!user.email_verified && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
        >
          <p className="text-sm" style={{ color: "#f59e0b" }}>
            Please verify your email address. Check your inbox for a link from Stabilium.
          </p>
          <button
            type="button"
            onClick={() => void resendVerification()}
            disabled={resendBusy || resendDone}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}
          >
            {resendDone ? "Email sent ✓" : resendBusy ? "Sending…" : "Resend email"}
          </button>
        </div>
      )}

      <JobForm busy={jobBusy} error={jobError} onSubmit={handleJobSubmit} />

      <JobsTable
        jobs={jobs}
        busy={jobsBusy}
        error={jobsError}
        onRefresh={() => void loadJobs(undefined)}
        onCancel={(id) => void cancelJob(id)}
        onViewReport={(id) => void openReport(id)}
      />

      {selectedReport && (
        <div data-print-report style={cardStyle(true)}>
          <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-white">
              {selectedReport.report.report_type === "job_failure" ? "Evaluation Error" : "Stability Report"}{" "}
              <span className="mono text-xs font-normal" style={{ color: "#d4d4d4" }}>
                {selectedReport.job_id}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#6366f1" }}
              >
                Download PDF
              </button>
              {selectedReport.report.job_type === "agent_benchmark" && (
                <Link
                  href={`/app/jobs/${selectedReport.job_id}/traces`}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
                  style={{ border: "1px solid rgba(91,124,247,0.35)", color: "#5b7cf7" }}
                >
                  Open traces
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium transition hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#d4d4d4" }}
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
