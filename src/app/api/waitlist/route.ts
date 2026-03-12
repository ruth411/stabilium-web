import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

// 3 waitlist signups per IP per hour
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const NOTIFY_EMAIL = "ruthwikdov@gmail.com";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkRateLimit(`waitlist:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 503 });
  }
  const resend = new Resend(resendApiKey);

  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    // Notify founder
    await resend.emails.send({
      from: "Stabilium Waitlist <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      subject: `New waitlist signup: ${email}`,
      html: `<p><strong>${email}</strong> just joined the Stabilium waitlist.</p>`,
    });

    // Confirm to user
    await resend.emails.send({
      from: "Stabilium <onboarding@resend.dev>",
      to: email,
      subject: "You're on the Stabilium waitlist",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 8px">You're on the list.</h2>
          <p style="color:#555;margin:0 0 24px">
            Thanks for signing up for early access to Stabilium — the AI agent reliability platform.
            We'll reach out shortly to get you set up.
          </p>
          <p style="color:#555;margin:0">
            In the meantime, check out the open-source library:<br/>
            <a href="https://github.com/ruth411/Stabilium">github.com/ruth411/Stabilium</a>
          </p>
          <p style="color:#999;font-size:12px;margin-top:32px">Stabilium · stabilium.ruthwikdovala.com</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
