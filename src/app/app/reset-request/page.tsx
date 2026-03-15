"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldStyle } from "../_types";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMessage(data.error ?? "Something went wrong.");
        setStatus("idle");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#0a0e1a" }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={cardStyle}>
        <h2 className="mb-2 text-lg font-bold text-white">Forgot your password?</h2>
        <p className="mb-6 text-sm" style={{ color: "#c4cfe0" }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {status === "sent" ? (
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#00d68f" }}>Check your inbox</p>
            <p className="mt-2 text-sm" style={{ color: "#c4cfe0" }}>
              If that email is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link
              href="/app"
              className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#c4cfe0" }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#c4cfe0" }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/20"
                style={fieldStyle()}
                placeholder="you@example.com"
              />
            </div>
            {errorMessage && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#00d68f" }}
            >
              {status === "submitting" ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-xs" style={{ color: "#c4cfe0" }}>
              <Link href="/app" className="hover:text-white transition-colors">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
