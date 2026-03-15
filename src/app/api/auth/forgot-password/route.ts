import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { BACKEND_URL, extractErrorMessage, parseJsonSafe } from "@/lib/backend";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const FORGOT_RATE_LIMIT = 5;
const FORGOT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function sendResetEmail(toEmail: string, resetToken: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://stabilium.ruthwikdovala.com";
  const link = `${appUrl}/app/reset?token=${encodeURIComponent(resetToken)}`;
  await resend.emails.send({
    from: "Stabilium <onboarding@resend.dev>",
    to: toEmail,
    subject: "Reset your Stabilium password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#555;margin:0 0 24px">Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#5b7cf7;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Reset password</a>
        <p style="color:#999;font-size:12px;margin-top:32px">If you didn't request a password reset, you can ignore this email. Your password won't change.</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkRateLimit(`forgot-password:${ip}`, FORGOT_RATE_LIMIT, FORGOT_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(payload, "Could not process request") },
      { status: response.status },
    );
  }

  const p = payload as { reset_token?: unknown };
  const resetToken = typeof p.reset_token === "string" ? p.reset_token : null;
  const email = body && typeof body === "object" ? (body as { email?: unknown }).email : undefined;

  if (resetToken && typeof email === "string") {
    void sendResetEmail(email, resetToken).catch(() => undefined);
  }

  // Always return OK to avoid email enumeration
  return NextResponse.json({ status: "ok" });
}
