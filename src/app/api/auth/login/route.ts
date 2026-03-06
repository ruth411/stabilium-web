import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Login failed") },
      { status: response.status },
    );
  }

  const token = payload && typeof payload === "object" ? (payload as { token?: unknown }).token : undefined;
  const user = payload && typeof payload === "object" ? (payload as { user?: unknown }).user : undefined;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Backend did not return a session token" }, { status: 502 });
  }

  const out = NextResponse.json({ user });
  out.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return out;
}
