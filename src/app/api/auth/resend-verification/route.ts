import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const RESEND_RATE_LIMIT = 3;
const RESEND_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function sendVerificationEmail(toEmail: string, verificationToken: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;
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
  const ip = clientIp(req);
  if (!checkRateLimit(`resend-verification:${ip}`, RESEND_RATE_LIMIT, RESEND_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not resend verification email") },
      { status: response.status },
    );
  }

  const p = payload as { email_verification_token?: unknown };
  const verificationToken = typeof p.email_verification_token === "string" ? p.email_verification_token : null;
  const email = body && typeof body === "object" ? (body as { email?: unknown }).email : undefined;

  if (verificationToken && typeof email === "string") {
    void sendVerificationEmail(email, verificationToken).catch(() => undefined);
  }

  return NextResponse.json({ status: "ok" });
}
