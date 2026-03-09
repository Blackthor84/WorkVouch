# Backend architecture

**Flow:** Pages / API routes → **Services** → **DB (queries/mutations)** → Supabase

## Layers

### 1. DB layer (`lib/db`)

- **Responsibility:** Direct database access only. No business logic.
- **Queries:** `lib/db/queries/*` — read-only `.select()`.
- **Mutations:** `lib/db/mutations/*` — `.insert()`, `.update()`, `.delete()`.
- **Rules:**
  - Only Supabase calls here.
  - Return typed results (use `lib/db/types`).
  - Use the safe pattern: `if (error) throw new Error(error.message); return data ?? [];`

**Example:**

```ts
// lib/db/queries/getJobsByProfile.ts
export async function getJobsByProfile(profileId: string): Promise<JobRow[]> {
  const { data, error } = await supabase.from("jobs").select("*").eq("user_id", profileId);
  if (error) throw new Error(error.message);
  return data ?? [];
}
```

### 2. Service layer (`lib/services`)

- **Responsibility:** Business logic. Composes DB queries/mutations.
- **Structure:** Domain folders — `profiles/`, `jobs/`, `verifications/`, `trust/`, `employers/`.
- **Rules:**
  - No direct Supabase. Call `@/lib/db/queries` or `@/lib/db/mutations`.
  - Return DTOs or domain types from `lib/services/types`.

**Example:**

```ts
// lib/services/profiles/getCandidateProfile.ts
import { getProfileByPublicSlug, getVerifiedJobsByUserId, getJobVerificationsByJobIds } from "@/lib/db/queries";

export async function getCandidateProfile(slug: string): Promise<CandidateProfileDTO | null> {
  const profile = await getProfileByPublicSlug(slug);
  if (!profile) return null;
  const jobs = await getVerifiedJobsByUserId(profile.id);
  // ... aggregate confirmations, return DTO
}
```

### 3. Pages / API routes

- **Responsibility:** Auth, redirects, and calling services. No Supabase.
- **Rule:** Import from `@/lib/services/*` or `@/lib/auth`, etc. Never `from("jobs")` in a page.

**Example:**

```ts
// app/candidate/[slug]/page.tsx
import { getCandidateProfile, getCandidatePreview } from "@/lib/services/profiles";

const preview = await getCandidatePreview(slug);
if (!preview) notFound();
const candidate = await getCandidateProfile(slug);
```

## Folder layout

```
lib/
  supabase/          # Client creation (server, client, admin)
  db/
    queries/         # Read-only Supabase .select()
    mutations/       # Insert / update / delete
    types.ts         # Row types (ProfileRow, JobRow, …)
  services/
    types.ts         # Service DTOs (CandidateProfileDTO, …)
    profiles/
    jobs/
    verifications/
    trust/
    employers/
  middleware/
  utils/
```

## Typing

- **DB layer:** Use `lib/db/types` (e.g. `JobRow`, `ProfileRow`). Avoid `as unknown as T`.
- **Service layer:** Use `lib/services/types` for return DTOs.
- **Supabase client:** Use generated `Database` from `types/supabase.ts` for the client; use `admin as any` in DB queries only when inference fails, and keep return types explicit.
