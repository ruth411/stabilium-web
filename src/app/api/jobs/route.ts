import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";

function requireToken(req: NextRequest): string | null {
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function GET(req: NextRequest) {
  const token = requireToken(req);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not load jobs") },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const token = requireToken(req);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not create job") },
      { status: response.status },
    );
  }

  return NextResponse.json(payload, { status: response.status });
}
