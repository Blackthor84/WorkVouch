# send-referral-email

Sends the viral referral email when a new row is inserted into `public.referrals`. Uses **Resend**.

## Trigger: Database Webhook

1. **Database** → **Webhooks** → **Create a new webhook**
2. **Table:** `referrals`
3. **Events:** **Insert**
4. **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/send-referral-email`
5. **HTTP Headers:** `Authorization` = `Bearer <REFERRAL_WEBHOOK_SECRET>`

## Secrets

- `RESEND_API_KEY` – Resend API key
- `RESEND_FROM` – Sender (e.g. `WorkVouch <notifications@yourdomain.com>`)
- `WORKVOUCH_APP_URL` – Base URL for the “Join WorkVouch” link (default `https://app.workvouch.com`)
- `REFERRAL_WEBHOOK_SECRET` – Shared secret for webhook auth

## Deploy

```bash
supabase functions deploy send-referral-email
```

## Email content

Subject and body match the exact viral copy in `docs/REFERRAL_EMAIL_COPY.md`. Recipient = `record.referred_email`.
