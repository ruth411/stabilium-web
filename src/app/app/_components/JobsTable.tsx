"use client";

import Link from "next/link";
import React from "react";
import type { Job } from "../_types";
import { cardStyle, fmtDate, jobTypeLabel, statusColor } from "../_types";

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

type JobsTableProps = {
  jobs: Job[];
  busy: boolean;
  error: string | null;
  onRefresh: () => void;
  onCancel: (jobId: string) => void;
  onViewReport: (jobId: string) => void;
};

export function JobsTable({ jobs, busy, error, onRefresh, onCancel, onViewReport }: JobsTableProps) {
  return (
    <div style={cardStyle()}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Your evaluations</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-40"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Status", "Mode", "Provider", "Model", "ASI", "Cases", "Created", ""].map((h) => (
                <th key={h} className="pb-3 pr-4 text-left text-xs font-medium" style={{ color: "#d4d4d4" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const isActive = job.status === "running" || job.status === "queued";
              const isFailed = job.status === "failed";
              const pct =
                job.status === "running" && job.max_cases > 0
                  ? Math.min(100, Math.round((job.completed_cases / job.max_cases) * 100))
                  : 0;

              return (
                <React.Fragment key={job.id}>
                  <tr style={{ borderBottom: isActive || isFailed ? undefined : "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-3 pr-4"><StatusDot status={job.status} /></td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "#d4d4d4" }}>{jobTypeLabel(job.job_type)}</td>
                    <td className="py-3 pr-4 capitalize" style={{ color: "#eef2f7" }}>{job.provider}</td>
                    <td className="py-3 pr-4 font-mono text-xs" style={{ color: "#eef2f7" }}>{job.model}</td>
                    <td className="py-3 pr-4 font-bold tabular-nums" style={{ color: job.mean_asi != null ? "#00d68f" : "#d4d4d4" }}>
                      {job.mean_asi != null ? job.mean_asi.toFixed(2) : "—"}
                    </td>
                    <td className="py-3 pr-4 tabular-nums" style={{ color: "#d4d4d4" }}>
                      {job.status === "running" ? (
                        <span>
                          <span style={{ color: "#00d68f" }}>{job.completed_cases}</span> / {job.max_cases}
                        </span>
                      ) : (
                        job.num_cases ?? "—"
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "#d4d4d4" }}>{fmtDate(job.created_at)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => onCancel(job.id)}
                            className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5"
                            style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                          >
                            Stop
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewReport(job.id)}
                          disabled={job.status !== "completed" && job.status !== "failed"}
                          className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5 disabled:opacity-30"
                          style={{
                            border: isFailed ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            color: isFailed ? "#ef4444" : "#eef2f7",
                          }}
                        >
                          {isFailed ? "View error" : "View report"}
                        </button>
                        {job.job_type === "agent_benchmark" && (
                          <Link
                            href={`/app/jobs/${job.id}/traces`}
                            className="rounded-lg px-3 py-1 text-xs font-medium transition hover:bg-white/5"
                            style={{ border: "1px solid rgba(91,124,247,0.35)", color: "#5b7cf7" }}
                          >
                            Traces
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isActive && (
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td colSpan={8} className="pb-3 pt-0">
                        <div className="relative overflow-hidden rounded-full" style={{ height: "6px", background: "rgba(255,255,255,0.06)" }}>
                          {job.status === "running" ? (
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: "linear-gradient(90deg, #00d68f, #00b87a)",
                                boxShadow: "0 0 8px #00d68f88",
                              }}
                            />
                          ) : (
                            <div
                              className="absolute inset-y-0 w-1/4 rounded-full"
                              style={{ background: "rgba(255,255,255,0.18)", animation: "progress-shimmer 1.6s ease-in-out infinite" }}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-xs" style={{ color: "#d4d4d4" }}>
                          {job.status === "running"
                            ? `${job.completed_cases} of ${job.max_cases} cases complete · ${pct}%`
                            : "Queued — waiting to start…"}
                        </p>
                      </td>
                    </tr>
                  )}

                  {isFailed && job.error_message && (
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td colSpan={8} className="pb-3 pt-0">
                        <p
                          className="mt-1 rounded-lg px-3 py-2 font-mono text-xs"
                          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}
                        >
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
                <td className="py-8 text-sm" colSpan={8} style={{ color: "#d4d4d4" }}>
                  No evaluations yet. Submit your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
