import type { CSSProperties } from "react";

export type User = {
  id: string;
  name: string;
  business_name: string;
  email: string;
  created_at: string;
};

export type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  provider: string;
  model: string;
  job_type: "benchmark" | "conversation_benchmark" | "agent_benchmark";
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

export type JobListResponse = { jobs: Job[] };
export type JobReportResponse = { job_id: string; report: Record<string, unknown> };
export type AuthMode = "login" | "register";
export type EvaluationMode = "benchmark" | "conversation_benchmark" | "agent_benchmark";

export type AsiStatistics = {
  mean?: number;
  ci_low?: number;
  ci_high?: number;
  std?: number;
  n?: number;
  sample_size?: number;
};

export const MODE_CONFIG: Record<
  EvaluationMode,
  { label: string; description: string; suite: string; maxCasesHint: number; faultRateDefault: number }
> = {
  benchmark: {
    label: "Single-turn",
    description: "Classic ASI benchmark over independent prompts.",
    suite: "examples/benchmarks/large_suite.json",
    maxCasesHint: 60,
    faultRateDefault: 0,
  },
  conversation_benchmark: {
    label: "Conversation",
    description: "Multi-turn stability (memory, constraints, consistency, context).",
    suite: "examples/benchmarks/conversation_suite.json",
    maxCasesHint: 40,
    faultRateDefault: 0,
  },
  agent_benchmark: {
    label: "Agent",
    description: "Tool-call trajectory stability with fault-injection robustness.",
    suite: "examples/agent_tasks/sample_tasks.json",
    maxCasesHint: 20,
    faultRateDefault: 0.1,
  },
};

export function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function statusColor(s: Job["status"]): string {
  if (s === "completed") return "#00d68f";
  if (s === "running") return "#f59e0b";
  if (s === "failed") return "#ef4444";
  if (s === "cancelled") return "#6b7280";
  return "#8b9ab0";
}

export function jobTypeLabel(jobType: Job["job_type"] | EvaluationMode): string {
  if (jobType === "conversation_benchmark") return "Conversation";
  if (jobType === "agent_benchmark") return "Agent";
  return "Single-turn";
}

export function fieldStyle(): CSSProperties {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#eef2f7",
  };
}

export function cardStyle(featured = false): CSSProperties {
  return {
    background: featured ? "rgba(0,214,143,0.05)" : "rgba(255,255,255,0.03)",
    border: featured ? "1px solid rgba(0,214,143,0.2)" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1rem",
    padding: "1.5rem",
  };
}

export function asiColor(score: number): string {
  if (score >= 85) return "#00d68f";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

export function asiLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs work";
}
