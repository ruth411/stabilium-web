"use client";

import { FormEvent, useState } from "react";
import type { EvaluationMode } from "../_types";
import { MODE_CONFIG, cardStyle, fieldStyle } from "../_types";

export type JobFormData = {
  provider: "openai" | "anthropic";
  model: string;
  apiKey: string;
  runCount: number;
  maxCases: number;
  seed: number;
  workers: number;
  jobType: EvaluationMode;
  faultRate: number;
};

type JobFormProps = {
  busy: boolean;
  error: string | null;
  onSubmit: (data: JobFormData) => Promise<void>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: "#c4cfe0" }}>{label}</span>
      {children}
    </label>
  );
}

export function JobForm({ busy, error, onSubmit }: JobFormProps) {
  const [jobType, setJobType] = useState<EvaluationMode>("benchmark");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [runCount, setRunCount] = useState(3);
  const [maxCases, setMaxCases] = useState(20);
  const [seed, setSeed] = useState(42);
  const [workers, setWorkers] = useState(3);
  const [faultRate, setFaultRate] = useState(0.1);

  function selectMode(mode: EvaluationMode) {
    setJobType(mode);
    setMaxCases(MODE_CONFIG[mode].maxCasesHint);
    setFaultRate(MODE_CONFIG[mode].faultRateDefault);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ provider, model, apiKey, runCount, maxCases, seed, workers, jobType, faultRate });
    setApiKey("");
  }

  return (
    <div style={cardStyle()}>
      <h2 className="mb-5 text-lg font-bold text-white">Run new evaluation</h2>

      {/* Mode selector */}
      <div className="mb-5 grid gap-2 md:grid-cols-3">
        {(Object.keys(MODE_CONFIG) as EvaluationMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectMode(mode)}
            className="rounded-xl px-4 py-3 text-left transition"
            style={
              jobType === mode
                ? { background: "rgba(0,214,143,0.12)", border: "1px solid rgba(0,214,143,0.28)" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }
            }
          >
            <p className="text-sm font-bold" style={{ color: jobType === mode ? "#00d68f" : "#eef2f7" }}>
              {MODE_CONFIG[mode].label}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#c4cfe0" }}>
              {MODE_CONFIG[mode].description}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
            type="number" min={1} max={10} value={runCount}
            onChange={(e) => setRunCount(Number(e.target.value) || 1)}
            className="h-11 rounded-xl px-3 outline-none"
            style={fieldStyle()} required
          />
        </Field>

        <Field label="Max cases (1–100)">
          <input
            type="number" min={1} max={100} value={maxCases}
            onChange={(e) => setMaxCases(Number(e.target.value) || 1)}
            className="h-11 rounded-xl px-3 outline-none"
            style={fieldStyle()} required
          />
        </Field>

        <Field label="Seed">
          <input
            type="number" value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className="h-11 rounded-xl px-3 outline-none"
            style={fieldStyle()} required
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

        {jobType === "agent_benchmark" && (
          <Field label="Fault injection rate (0.00–0.50)">
            <input
              type="number" min={0} max={0.5} step={0.01} value={faultRate}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n)) setFaultRate(Math.max(0, Math.min(0.5, n)));
              }}
              className="h-11 rounded-xl px-3 outline-none"
              style={fieldStyle()} required
            />
          </Field>
        )}

        <div className="flex items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={busy || !apiKey.trim()}
            className="btn-primary h-11 rounded-xl px-7 text-sm"
          >
            {busy ? "Submitting…" : "Submit evaluation →"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <p className="text-xs md:col-span-2" style={{ color: "#c4cfe0" }}>
          Mode: <span className="font-semibold" style={{ color: "#eef2f7" }}>{MODE_CONFIG[jobType].label}</span>
          {" · "}
          Suite: <span className="mono" style={{ color: "#5b7cf7" }}>{MODE_CONFIG[jobType].suite}</span>
          {jobType === "agent_benchmark" && (
            <> · Fault rate: <span className="mono" style={{ color: "#f59e0b" }}>{faultRate.toFixed(2)}</span></>
          )}
        </p>
      </form>
    </div>
  );
}
