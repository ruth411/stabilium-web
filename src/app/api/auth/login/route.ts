import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
// 10 login attempts per IP per 15 minutes
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes before trying again." },
      { status: 429 },
    );
  }
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
