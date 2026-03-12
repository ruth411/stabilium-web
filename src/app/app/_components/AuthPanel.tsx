"use client";

import { FormEvent, useState } from "react";
import type { AuthMode, User } from "../_types";
import { cardStyle, fieldStyle } from "../_types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: "#8b9ab0" }}>{label}</span>
      {children}
    </label>
  );
}

export function AuthPanel({
  initialMode,
  onAuth,
}: {
  initialMode: AuthMode;
  onAuth: (user: User) => void;
}) {
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

  function switchMode(m: AuthMode) {
    setMode(m);
    setError(null);
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <div className="w-full max-w-sm" style={cardStyle()}>
        <div
          className="mb-6 flex overflow-hidden rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
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

          <button type="submit" disabled={busy} className="btn-primary mt-1 h-11 rounded-xl text-sm">
            {busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs" style={{ color: "#8b9ab0" }}>
          {mode === "login" ? "No account?" : "Already have one?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{ color: "#00d68f" }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
