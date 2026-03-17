# Notification email (Database Webhook)

When a row is **inserted** into `public.notifications`, an email is sent via the Edge Function `send-notification-email` (Resend).

## 1. Deploy the Edge Function

```bash
supabase functions deploy send-notification-email
```

## 2. Set secrets

In **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets** (or `supabase secrets set ...`):

- `RESEND_API_KEY` – Resend API key
- `RESEND_FROM` – e.g. `WorkVouch <notifications@yourdomain.com>` (verified domain in Resend)
- `WORKVOUCH_APP_URL` – e.g. `https://yourapp.com`
- `NOTIFICATION_WEBHOOK_SECRET` – random string; you’ll use this in the webhook header

## 3. Create the Database Webhook

1. **Database** → **Webhooks** → **Create a new webhook**
2. **Name**: `notifications-insert-email`
3. **Table**: `notifications`
4. **Events**: **Insert**
5. **Type**: **HTTP Request**
6. **URL**:  
   `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-notification-email`  
   (Replace `<YOUR_PROJECT_REF>` with your project reference from Project Settings → General.)
7. **HTTP Headers**:
   - Key: `Authorization`
   - Value: `Bearer <NOTIFICATION_WEBHOOK_SECRET>` (same value as the secret)

Save the webhook. New notification rows will trigger the function and send the email.

## Email content

- Friendly message from the notification `message`/`title`
- Type label (e.g. “Reference request”, “Reference accepted”)
- CTA button: **View in WorkVouch** → `{WORKVOUCH_APP_URL}/notifications`

## Troubleshooting

- **401**: Webhook secret missing or wrong; check header and `NOTIFICATION_WEBHOOK_SECRET`.
- **422**: No auth user found for `user_id`; ensure the notification’s `user_id` exists in `auth.users`.
- **502**: Resend error; check `RESEND_API_KEY` and `RESEND_FROM` (verified domain).
