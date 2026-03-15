"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fieldStyle } from "../_types";

function ResetPageInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const missingToken = !token;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setErrorMessage("No reset token found in the URL.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMessage(data.error ?? "Password reset failed.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#0a0e1a" }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={cardStyle}>
        <h2 className="mb-6 text-lg font-bold text-white">Reset your password</h2>

        {status === "success" ? (
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#00d68f" }}>Password updated!</p>
            <p className="mt-2 text-sm" style={{ color: "#d4d4d4" }}>You can now sign in with your new password.</p>
            <Link
              href="/app"
              className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              style={{ background: "#00d68f" }}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#d4d4d4" }}>
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/20"
                style={fieldStyle()}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#d4d4d4" }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/20"
                style={fieldStyle()}
                placeholder="Repeat password"
              />
            </div>
            {(status === "error" || missingToken) && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {errorMessage || "No reset token found in the URL."}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "submitting" || missingToken}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#00d68f" }}
            >
              {status === "submitting" ? "Updating…" : "Update password"}
            </button>
            <p className="text-center text-xs" style={{ color: "#d4d4d4" }}>
              <Link href="/app" className="hover:text-white transition-colors">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetPageInner />
    </Suspense>
  );
}
