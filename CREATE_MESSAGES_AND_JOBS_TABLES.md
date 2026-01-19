# Create Messages and Job Postings Tables

## The Error

```
Failed to fetch messages: Could not find the table 'public.messages' in the schema cache
Failed to fetch job postings: Could not find the table 'public.job_postings' in the schema cache
```

## ✅ Solution

**Run this SQL in Supabase SQL Editor:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `supabase/create_messages_and_job_postings.sql`
3. Paste and run it
4. Wait for "Success" message

## What This Creates

- ✅ **`messages` table** - For user-to-user and employer-to-candidate messaging
- ✅ **`job_postings` table** - For employer job listings
- ✅ **Indexes** - For fast queries
- ✅ **RLS Policies** - Secure access control
- ✅ **Triggers** - Auto-update timestamps

## After Running

The messages and job postings features will work:
- ✅ Users can send/receive messages
- ✅ Employers can create job postings
- ✅ Job postings can be published/viewed

---

**Run the SQL file in Supabase SQL Editor to fix the errors!**
