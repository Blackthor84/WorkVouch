// Supabase Edge Function: send viral referral email when a row is inserted into referrals.
// Trigger: Database Webhook on referrals INSERT → POST to this function.
// Requires: RESEND_API_KEY, RESEND_FROM, WORKVOUCH_APP_URL, REFERRAL_WEBHOOK_SECRET.

const RESEND_API = "https://api.resend.com/emails";

interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_email: string;
  status: string;
  created_at?: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: ReferralRecord;
  old_record: unknown;
}

const BODY_TEXT = `Hey,

I'm using WorkVouch to verify my work history, and it matched me with people I worked with.

It looks like you might've worked at the same place as me.

Can you confirm?

It takes 30 seconds:
👉 {{CTA_URL}}

This helps both of us boost our trust score and unlock better opportunities.

Appreciate it 🙌`;

const SUBJECT = "Can you confirm we worked together?";

function buildHtml(ctaUrl: string): string {
  const text = BODY_TEXT.replace(/\{\{CTA_URL\}\}/g, ctaUrl);
  const htmlBody = text
    .split("\n")
    .map((p) => (p.trim() ? `<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#0f172a;">${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""))
    .filter(Boolean)
    .join("");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;">
    <div style="padding:32px 24px;">
      ${htmlBody}
      <p style="margin:24px 0 0;">
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:12px;">Join WorkVouch</a>
      </p>
    </div>
    <p style="margin:0;padding:16px 24px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;">WorkVouch – Verify your work history & boost your trust score</p>
  </div>
</body>
</html>
`.trim();
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("REFERRAL_WEBHOOK_SECRET");
  if (webhookSecret) {
    const auth = req.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payload.type !== "INSERT" || payload.table !== "referrals" || !payload.record?.referred_email) {
    return new Response(
      JSON.stringify({ error: "Invalid payload: expected INSERT on referrals with record.referred_email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const record = payload.record as ReferralRecord;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  const appUrl = (Deno.env.get("WORKVOUCH_APP_URL") || "https://app.workvouch.com").replace(/\/$/, "");

  if (!resendKey || !resendFrom) {
    console.error("Missing RESEND_API_KEY or RESEND_FROM");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const toEmail = record.referred_email.trim().toLowerCase();
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [toEmail],
      subject: SUBJECT,
      html: buildHtml(appUrl),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend API error:", res.status, err);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: res.status }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
