import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  const response = await fetch(`${BACKEND_URL}/jobs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not load job") },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  const response = await fetch(`${BACKEND_URL}/jobs/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not cancel job") },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}
