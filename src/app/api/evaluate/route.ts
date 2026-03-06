import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // allow up to 3 minutes — benchmarks can take time
      signal: AbortSignal.timeout(180_000),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = (data as { detail?: string }).detail ?? "Evaluation failed";
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json(
        { error: "Evaluation timed out. Try fewer cases or a faster model." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "Could not reach the Stabilium backend. Is the server running?" },
      { status: 503 },
    );
  }
}
