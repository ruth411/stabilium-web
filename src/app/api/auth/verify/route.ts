import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Verification failed") },
      { status: response.status },
    );
  }
  return NextResponse.json({ status: "verified" });
}
