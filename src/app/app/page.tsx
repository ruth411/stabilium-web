"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthMode, User } from "./_types";
import { AuthPanel } from "./_components/AuthPanel";
import { Dashboard } from "./_components/Dashboard";

function AppPageInner() {
  const params = useSearchParams();
  const initialMode: AuthMode = params.get("mode") === "register" ? "register" : "login";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) setUser((await res.json()) as User);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <div className="min-h-screen">
      {/* Gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-60 -right-60 h-[500px] w-[500px] rounded-full opacity-[0.12] blur-[100px]"
          style={{ background: "radial-gradient(circle, #00d68f, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.1] blur-[90px]"
          style={{ background: "radial-gradient(circle, #5b7cf7, transparent 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 py-4 md:px-10"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,9,15,0.7)", backdropFilter: "blur(20px)" }}
      >
        <Link href="/" className="flex items-center">
          <span className="text-lg font-black tracking-tight text-white">stabilium.</span>
        </Link>
        {user && <p className="text-xs" style={{ color: "#d4d4d4" }}>{user.email}</p>}
      </nav>

      <div className="relative z-10">
        {loading ? (
          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#00d68f" }}
            />
          </div>
        ) : user ? (
          <Dashboard user={user} onLogout={logout} />
        ) : (
          <AuthPanel initialMode={initialMode} onAuth={setUser} />
        )}
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense>
      <AppPageInner />
    </Suspense>
  );
}
