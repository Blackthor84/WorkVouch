# Referral invite email (viral copy)

**Use this exact copy** for the email sent when a user invites a coworker (referrals table).

---

**Subject:**  
Can you confirm we worked together?

---

**Body:**

Hey,

I'm using WorkVouch to verify my work history, and it matched me with people I worked with.

It looks like you might've worked at the same place as me.

Can you confirm?

It takes 30 seconds:
👉 [Join WorkVouch]

This helps both of us boost our trust score and unlock better opportunities.

Appreciate it 🙌

---

- **CTA button/link:** “Join WorkVouch” → `{WORKVOUCH_APP_URL}` (e.g. https://app.workvouch.com or your app URL).
- Sent by: Edge Function `send-referral-email` when a row is inserted into `referrals` (Database Webhook).
