# send-notification-email

Sends an email when a new row is inserted into `public.notifications`. Uses **Resend** for delivery.

## Trigger: Database Webhook

1. In **Supabase Dashboard**: Project → **Database** → **Webhooks** → **Create a new webhook**.
2. Configure:
   - **Name**: `notifications-insert-email`
   - **Table**: `notifications`
   - **Events**: **Insert**
   - **URL**: `https://<PROJECT_REF>.supabase.co/functions/v1/send-notification-email`
   - **HTTP Headers** (recommended):  
     `Authorization` = `Bearer <NOTIFICATION_WEBHOOK_SECRET>`

## Secrets (Edge Function)

Set in **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, or via CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set RESEND_FROM="WorkVouch <notifications@yourdomain.com>"
supabase secrets set WORKVOUCH_APP_URL=https://yourapp.com
supabase secrets set NOTIFICATION_WEBHOOK_SECRET=<random-secret>
```

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key ([resend.com](https://resend.com)) |
| `RESEND_FROM` | Yes | Sender (e.g. `WorkVouch <notifications@yourdomain.com>`); must be a verified domain in Resend |
| `WORKVOUCH_APP_URL` | No | Base URL of the app (default `https://app.workvouch.com`). Used for the "View in WorkVouch" link. |
| `NOTIFICATION_WEBHOOK_SECRET` | Recommended | Shared secret; webhook must send `Authorization: Bearer <secret>`. If unset, no auth is required. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically by Supabase at runtime.

## Email content

- **Subject**: `{Type label} – WorkVouch` (e.g. "Reference request – WorkVouch").
- **Body**: Friendly message from `record.message` (or `record.title`), plus a **View in WorkVouch** button linking to `{WORKVOUCH_APP_URL}/notifications`.
- **Type labels**: `reference_request` → "Reference request", `reference_approved` → "Reference accepted", `coworker_match` → "New coworker match", `employer_purchase` → "Employer activity".

## Deploy

```bash
supabase functions deploy send-notification-email
```

## Security

- **Webhook auth**: Use `NOTIFICATION_WEBHOOK_SECRET` and set the same value as `Authorization: Bearer <secret>` in the webhook so only Supabase can call the function.
- **Recipient**: Recipient email is resolved from `auth.users` via `user_id` using the service role; no email is taken from the webhook body.
- **No PII in logs**: Avoid logging `record` or recipient email in production.
