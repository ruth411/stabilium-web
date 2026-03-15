"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyPageInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const missingToken = !token;

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    missingToken ? "error" : "verifying",
  );
  const [errorMessage, setErrorMessage] = useState(
    missingToken ? "No verification token found in the URL." : "",
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const data = (await res.json()) as { error?: string };
          setErrorMessage(data.error ?? "Verification failed.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMessage("Network error. Please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#0a0e1a" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {status === "verifying" && (
          <>
            <p className="text-lg font-semibold text-white">Verifying your email…</p>
            <p className="mt-2 text-sm" style={{ color: "#d4d4d4" }}>This will only take a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <p className="text-lg font-semibold" style={{ color: "#6366f1" }}>Email verified!</p>
            <p className="mt-2 text-sm" style={{ color: "#d4d4d4" }}>Your account is now fully activated.</p>
            <Link
              href="/app"
              className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              style={{ background: "#6366f1" }}
            >
              Go to dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-lg font-semibold" style={{ color: "#ef4444" }}>Verification failed</p>
            <p className="mt-2 text-sm" style={{ color: "#d4d4d4" }}>{errorMessage}</p>
            <Link
              href="/app"
              className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#d4d4d4" }}
            >
              Back to app
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageInner />
    </Suspense>
  );
}
