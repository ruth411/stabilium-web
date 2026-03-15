"use client";

import type { AsiStatistics } from "../_types";
import { asiColor, asiLabel } from "../_types";

type ReportViewProps = { data: Record<string, unknown> };

function ConversationMetrics({ data }: { data: Record<string, unknown> }) {
  const rawCases = data.cases;
  if (!Array.isArray(rawCases)) return null;

  const metricKeys = [
    "cross_run_variance",
    "turn_contradiction_rate",
    "context_failure_rate",
    "constraint_violation_rate",
    "drift_rate",
  ];
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const item of rawCases) {
    if (!item || typeof item !== "object") continue;
    const metrics = ((item as { report?: { metrics?: unknown } }).report as { metrics?: Record<string, unknown> } | undefined)?.metrics;
    if (!metrics) continue;
    for (const key of metricKeys) {
      const value = metrics[key];
      if (typeof value !== "number") continue;
      sums[key] = (sums[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const key of metricKeys) {
    if ((counts[key] ?? 0) > 0) averages[key] = sums[key] / counts[key];
  }
  if (Object.keys(averages).length === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h3 className="mb-3 text-xs font-semibold uppercase" style={{ color: "#c4cfe0", letterSpacing: "0.05em" }}>
        Conversation metrics (avg across cases)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(averages).map(([key, value]) => (
          <div key={key} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="mb-1 text-[11px] capitalize" style={{ color: "#c4cfe0" }}>{key.replaceAll("_", " ")}</p>
            <p className="mono text-sm font-bold" style={{ color: "#eef2f7" }}>{value.toFixed(3)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentMetrics({ data }: { data: Record<string, unknown> }) {
  const rawCases = data.cases;
  if (!Array.isArray(rawCases)) return null;

  const metricKeys = [
    "trajectory_consistency",
    "tool_selection_accuracy",
    "step_efficiency",
    "goal_completion_rate",
    "parameter_fidelity",
    "fault_robustness",
  ] as const;

  const rows: Array<{ taskId: string; metrics: Record<string, number> }> = [];
  for (const item of rawCases) {
    if (!item || typeof item !== "object") continue;
    const taskId = typeof (item as { task_id?: unknown }).task_id === "string"
      ? (item as { task_id: string }).task_id
      : "unknown-task";
    const metricsRaw = ((item as { report?: { metrics?: unknown } }).report as { metrics?: Record<string, unknown> } | undefined)?.metrics;
    if (!metricsRaw) continue;
    const metrics: Record<string, number> = {};
    for (const [k, v] of Object.entries(metricsRaw)) {
      if (typeof v === "number") metrics[k] = v;
    }
    rows.push({ taskId, metrics });
  }
  if (rows.length === 0) return null;

  // Averages across tasks
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const key of metricKeys) {
      const value = row.metrics[key];
      if (typeof value !== "number") continue;
      sums[key] = (sums[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const averages: Record<string, number> = {};
  for (const key of metricKeys) {
    if ((counts[key] ?? 0) > 0) averages[key] = sums[key] / counts[key];
  }

  return (
    <>
      {Object.keys(averages).length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="mb-3 text-xs font-semibold uppercase" style={{ color: "#c4cfe0", letterSpacing: "0.05em" }}>
            Trajectory metrics (avg across tasks)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(averages).map(([key, value]) => (
              <div key={key} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="mb-1 text-[11px] capitalize" style={{ color: "#c4cfe0" }}>{key.replaceAll("_", " ")}</p>
                <p className="mono text-sm font-bold" style={{ color: "#eef2f7" }}>{value.toFixed(3)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h3 className="mb-3 text-xs font-semibold uppercase" style={{ color: "#c4cfe0", letterSpacing: "0.05em" }}>
          Task trajectory timeline
        </h3>
        <div className="space-y-2">
          {rows.map((row) => {
            const traceAsi = typeof row.metrics.trace_asi === "number" ? row.metrics.trace_asi : 0;
            const tColor = asiColor(traceAsi);
            return (
              <div
                key={row.taskId}
                className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="mono text-xs" style={{ color: "#eef2f7" }}>{row.taskId}</span>
                  <span className="mono text-xs font-bold" style={{ color: tColor }}>
                    TraceASI {traceAsi.toFixed(2)}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["trajectory_consistency", "tool_selection_accuracy", "goal_completion_rate"] as const).map((metric) => {
                    const value = typeof row.metrics[metric] === "number" ? row.metrics[metric] : 0;
                    return (
                      <div key={metric}>
                        <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: "#c4cfe0" }}>
                          <span>{metric.replaceAll("_", " ")}</span>
                          <span className="mono">{(value * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: "#5b7cf7" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function ReportView({ data }: ReportViewProps) {
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
          <p className="text-sm" style={{ color: "#c4cfe0" }}>{completed} of {total} cases completed before failure.</p>
        )}
        <p className="text-xs" style={{ color: "#c4cfe0" }}>
          Check your API key and model name, then submit a new evaluation.
        </p>
      </div>
    );
  }

  const reportJobType = typeof data.job_type === "string" ? data.job_type : "benchmark";
  const isConversation = reportJobType === "conversation_benchmark";
  const isAgent = reportJobType === "agent_benchmark";

  const mean_asi =
    typeof data.mean_asi === "number" ? data.mean_asi
    : typeof data.mean_conv_asi === "number" ? data.mean_conv_asi
    : typeof data.mean_trace_asi === "number" ? data.mean_trace_asi
    : null;

  const domain_scores =
    data.domain_scores && typeof data.domain_scores === "object"
      ? (data.domain_scores as Record<string, number>)
      : {};

  const asi_statistics =
    data.asi_statistics && typeof data.asi_statistics === "object"
      ? (data.asi_statistics as AsiStatistics)
      : data.conv_asi_statistics && typeof data.conv_asi_statistics === "object"
        ? (data.conv_asi_statistics as AsiStatistics)
        : data.trace_asi_statistics && typeof data.trace_asi_statistics === "object"
          ? (data.trace_asi_statistics as AsiStatistics)
          : null;

  const num_cases = typeof data.num_cases === "number" ? data.num_cases : null;
  const run_count = typeof data.run_count === "number" ? data.run_count : null;
  const suite_name = typeof data.suite_name === "string" ? data.suite_name : "—";
  const benchmark_id = typeof data.benchmark_id === "string" ? data.benchmark_id : "—";
  const scoreTitle = isConversation ? "ConvASI score" : isAgent ? "TraceASI score" : "ASI score";

  const color = mean_asi != null ? asiColor(mean_asi) : "#c4cfe0";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = mean_asi != null ? circumference * (1 - mean_asi / 100) : circumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6">
        {/* Circular gauge */}
        <div className="flex flex-col items-center gap-3">
          <svg width="148" height="148" viewBox="0 0 148 148">
            <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
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
            <text x="74" y="68" textAnchor="middle" fill={color} fontSize="28" fontWeight="900" fontFamily="monospace">
              {mean_asi != null ? mean_asi.toFixed(1) : "—"}
            </text>
            <text x="74" y="86" textAnchor="middle" fill="#c4cfe0" fontSize="11" fontFamily="sans-serif">
              {scoreTitle}
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
                <p className="mb-1 text-xs" style={{ color: "#c4cfe0" }}>{label}</p>
                <p className="truncate text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {asi_statistics && typeof asi_statistics.ci_low === "number" && typeof asi_statistics.ci_high === "number" && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="mb-3 text-xs font-medium" style={{ color: "#c4cfe0" }}>95% confidence interval</p>
              <div className="flex items-center gap-3">
                <span className="mono w-12 text-right text-sm font-bold" style={{ color }}>
                  {asi_statistics.ci_low.toFixed(1)}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div
                    className="absolute inset-y-0 rounded-full opacity-30"
                    style={{ left: `${asi_statistics.ci_low}%`, right: `${100 - asi_statistics.ci_high}%`, background: color }}
                  />
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
                <p className="mt-2 text-xs" style={{ color: "#c4cfe0" }}>
                  σ&nbsp;=&nbsp;{asi_statistics.std.toFixed(2)}&ensp;·&ensp;n&nbsp;=&nbsp;
                  {asi_statistics.n ?? asi_statistics.sample_size ?? "—"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {isConversation && <ConversationMetrics data={data} />}
      {isAgent && <AgentMetrics data={data} />}

      {Object.keys(domain_scores).length > 0 && (
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase" style={{ color: "#c4cfe0", letterSpacing: "0.05em" }}>
            Domain breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(domain_scores).map(([domain, score]) => (
              <div key={domain} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs capitalize" style={{ color: "#eef2f7" }}>
                  {domain.replace(/_/g, " ")}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
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

      <p className="border-t pt-4 text-xs" style={{ color: "#c4cfe0", borderColor: "rgba(255,255,255,0.06)" }}>
        Benchmark ID &nbsp;<span className="mono" style={{ color: "#5b7cf7" }}>{benchmark_id}</span>
      </p>
    </div>
  );
}
