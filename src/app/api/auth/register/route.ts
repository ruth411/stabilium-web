import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { AUTH_COOKIE_NAME, BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

async function sendVerificationEmail(toEmail: string, verificationToken: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return; // graceful degradation — user sees banner to resend
  const resend = new Resend(resendApiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://stabilium.ruthwikdovala.com";
  const link = `${appUrl}/app/verify?token=${encodeURIComponent(verificationToken)}`;
  await resend.emails.send({
    from: "Stabilium <onboarding@resend.dev>",
    to: toEmail,
    subject: "Verify your Stabilium email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px">Click the link below to verify your email address. This link expires in 24 hours.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#000;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Verify email</a>
        <p style="color:#999;font-size:12px;margin-top:32px">If you didn't create a Stabilium account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Registration failed") },
      { status: response.status },
    );
  }

  const p = payload as { token?: unknown; user?: unknown; email_verification_token?: unknown };
  const token = typeof p.token === "string" ? p.token : undefined;
  const user = p.user;
  const emailVerificationToken = typeof p.email_verification_token === "string" ? p.email_verification_token : null;

  if (!token) {
    return NextResponse.json({ error: "Backend did not return a session token" }, { status: 502 });
  }

  // Send verification email — fire and forget; failure does not block login
  if (emailVerificationToken && user && typeof user === "object" && "email" in user && typeof (user as { email: unknown }).email === "string") {
    void sendVerificationEmail((user as { email: string }).email, emailVerificationToken).catch(() => undefined);
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
