"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ToolCall = {
  tool_call_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result: string | null;
  is_fault_injected: boolean;
  error: string | null;
  duration_ms: number;
};

type Trace = {
  trace_id: string;
  task_id: string;
  run_index: number;
  goal: string;
  tool_calls: ToolCall[];
  final_answer: string | null;
  success: boolean;
  total_steps: number;
  duration_ms: number;
  timed_out: boolean;
};

type TraceRecord = {
  task_id: string;
  run_index: number;
  trace: Trace;
};

type JobTracesResponse = {
  job_id: string;
  traces: TraceRecord[];
};

function statusColor(success: boolean): string {
  return success ? "#00d68f" : "#ef4444";
}

function preStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    color: "#c5cfde",
    fontSize: "0.75rem",
    overflowX: "auto",
  };
}

export default function JobTracesPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<JobTracesResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/${jobId}/traces`);
        const data = (await res.json()) as JobTracesResponse | { error?: string };
        if (!res.ok) {
          if (!mounted) return;
          setError((data as { error?: string }).error ?? "Could not load traces");
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setPayload(data as JobTracesResponse);
      } catch {
        if (!mounted) return;
        setError("Could not load traces");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (jobId) {
      void load();
    }
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const grouped = useMemo(() => {
    const map = new Map<string, TraceRecord[]>();
    for (const row of payload?.traces ?? []) {
      const list = map.get(row.task_id) ?? [];
      list.push(row);
      map.set(row.task_id, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([taskId, rows]) => ({
        taskId,
        rows: rows.sort((a, b) => a.run_index - b.run_index),
      }));
  }, [payload]);

  return (
    <div className="min-h-screen" style={{ background: "#08090f" }}>
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#8b9ab0" }}>
              Stage 6 · Agent Traces
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">Job traces</h1>
            <p className="mono mt-1 text-xs" style={{ color: "#5b7cf7" }}>
              {jobId}
            </p>
          </div>
          <Link
            href="/app"
            className="rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#eef2f7" }}
          >
            Back to dashboard
          </Link>
        </div>

        {loading && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p style={{ color: "#8b9ab0" }}>Loading traces…</p>
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <p className="font-semibold" style={{ color: "#ef4444" }}>Could not load traces</p>
            <p className="mt-1 text-sm" style={{ color: "#fca5a5" }}>{error}</p>
          </div>
        )}

        {!loading && !error && payload && (
          <div className="space-y-5">
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs" style={{ color: "#8b9ab0" }}>Total traces</p>
                  <p className="mono text-lg font-bold text-white">{payload.traces.length}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#8b9ab0" }}>Tasks</p>
                  <p className="mono text-lg font-bold text-white">{grouped.length}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#8b9ab0" }}>Successful runs</p>
                  <p className="mono text-lg font-bold" style={{ color: "#00d68f" }}>
                    {payload.traces.filter((x) => x.trace.success).length}
                  </p>
                </div>
              </div>
            </div>

            {grouped.length === 0 ? (
              <div
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p style={{ color: "#8b9ab0" }}>No traces stored for this job yet.</p>
              </div>
            ) : (
              grouped.map(({ taskId, rows }) => (
                <section
                  key={taskId}
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h2 className="mono mb-4 text-sm font-semibold text-white">{taskId}</h2>
                  <div className="space-y-3">
                    {rows.map((row) => {
                      const trace = row.trace;
                      return (
                        <article
                          key={`${trace.trace_id}-${row.run_index}`}
                          className="rounded-xl p-4"
                          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="mono text-xs" style={{ color: "#8b9ab0" }}>
                                run #{row.run_index}
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                style={{
                                  color: statusColor(trace.success),
                                  background: `${statusColor(trace.success)}22`,
                                  border: `1px solid ${statusColor(trace.success)}44`,
                                }}
                              >
                                {trace.success ? "success" : "failed"}
                              </span>
                              {trace.timed_out && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                  style={{ color: "#f59e0b", background: "#f59e0b22", border: "1px solid #f59e0b44" }}
                                >
                                  timed out
                                </span>
                              )}
                            </div>
                            <div className="mono text-xs" style={{ color: "#8b9ab0" }}>
                              {trace.total_steps} steps · {trace.duration_ms}ms
                            </div>
                          </div>

                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {trace.tool_calls.length === 0 ? (
                              <span className="text-xs" style={{ color: "#8b9ab0" }}>No tool calls</span>
                            ) : (
                              trace.tool_calls.map((tc, idx) => (
                                <span
                                  key={`${tc.tool_call_id}-${idx}`}
                                  className="mono rounded-full px-2.5 py-1 text-[11px]"
                                  style={{
                                    color: tc.is_fault_injected ? "#ef4444" : "#eef2f7",
                                    background: tc.is_fault_injected
                                      ? "rgba(239,68,68,0.12)"
                                      : "rgba(91,124,247,0.16)",
                                    border: tc.is_fault_injected
                                      ? "1px solid rgba(239,68,68,0.28)"
                                      : "1px solid rgba(91,124,247,0.32)",
                                  }}
                                >
                                  {idx + 1}. {tc.tool_name}
                                </span>
                              ))
                            )}
                          </div>

                          <details>
                            <summary
                              className="cursor-pointer text-xs font-semibold"
                              style={{ color: "#8b9ab0" }}
                            >
                              Raw tool call details
                            </summary>
                            <div className="mt-2 space-y-2">
                              {trace.tool_calls.map((tc, idx) => (
                                <div
                                  key={`${tc.tool_call_id}-raw-${idx}`}
                                  className="rounded-lg p-3"
                                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                  <p className="mono mb-1 text-xs" style={{ color: "#5b7cf7" }}>
                                    {tc.tool_name} · {tc.duration_ms}ms
                                  </p>
                                  <pre style={preStyle()}>{JSON.stringify(tc.arguments, null, 2)}</pre>
                                  <p className="mt-1 text-xs" style={{ color: "#8b9ab0" }}>
                                    result: {tc.result ?? "—"}
                                  </p>
                                  {tc.error && (
                                    <p className="mt-1 text-xs" style={{ color: "#fca5a5" }}>
                                      error: {tc.error}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>

                          <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="mb-1 text-xs" style={{ color: "#8b9ab0" }}>Final answer</p>
                            <p className="text-sm" style={{ color: "#eef2f7" }}>{trace.final_answer ?? "—"}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
