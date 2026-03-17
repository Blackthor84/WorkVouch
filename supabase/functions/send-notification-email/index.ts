// Supabase Edge Function: send email when a new row is inserted into notifications.
// Trigger: Database Webhook on notifications INSERT → POST to this function.
// Requires: RESEND_API_KEY, RESEND_FROM, WORKVOUCH_APP_URL, NOTIFICATION_WEBHOOK_SECRET (and SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY to resolve recipient email).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API = "https://api.resend.com/emails";

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at?: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: NotificationRecord;
  old_record: unknown;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "reference_request":
      return "Reference request";
    case "reference_approved":
      return "Reference accepted";
    case "coworker_match":
      return "New coworker match";
    case "employer_purchase":
      return "Employer activity";
    default:
      return "Notification";
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(record: NotificationRecord, viewUrl: string): string {
  const typeLabel = escapeHtml(getTypeLabel(record.type));
  const raw = record.message || record.title || "You have a new update.";
  const friendlyMessage = escapeHtml(raw);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeLabel} &#8211; WorkVouch</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;">
    <div style="padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">${typeLabel}</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#0f172a;">${friendlyMessage}</p>
      <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:12px;">View in WorkVouch</a>
    </div>
    <p style="margin:0;padding:16px 24px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;">WorkVouch – Coworker network & references</p>
  </div>
</body>
</html>
`.trim();
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("NOTIFICATION_WEBHOOK_SECRET");
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

  if (payload.type !== "INSERT" || payload.table !== "notifications" || !payload.record?.user_id) {
    return new Response(
      JSON.stringify({ error: "Invalid payload: expected INSERT on notifications with record.user_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const record = payload.record as NotificationRecord;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  const appUrl = (Deno.env.get("WORKVOUCH_APP_URL") || "https://app.workvouch.com").replace(/\/$/, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!resendKey || !resendFrom) {
    console.error("Missing RESEND_API_KEY or RESEND_FROM");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let toEmail: string;
  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.admin.getUserById(record.user_id);
    if (error || !user?.email) {
      console.error("Could not resolve recipient email for user_id:", record.user_id);
      return new Response(JSON.stringify({ error: "Recipient not found" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    toEmail = user.email;
  } else {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const viewUrl = `${appUrl}/notifications`;
  const subject = `${getTypeLabel(record.type)} – WorkVouch`;
  const html = buildHtml(record, viewUrl);

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [toEmail],
      subject,
      html,
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
