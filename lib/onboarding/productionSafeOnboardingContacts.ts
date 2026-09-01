import { admin } from "@/lib/supabase-admin";
import { generateInviteToken } from "@/lib/invites/inviteToken";
import {
  isMissingColumnError,
  isMissingTableError,
  missingColumnFromError,
  type PostgrestErrorLike,
} from "@/lib/supabase/postgrestErrors";

export type OnboardingContactInput = {
  position: number;
  display_name: string;
  email: string | null;
  phone: string | null;
};

export type OnboardingContactRecord = {
  id: string;
  position: number;
  display_name: string;
  email: string | null;
  phone: string | null;
  coworker_invite_id: string | null;
  inviteSent: boolean;
  storage: "worker_onboarding_contacts" | "coworker_invites";
};

type MutateResult = { data: unknown; error: PostgrestErrorLike };

function displayNameFromContact(input: {
  display_name?: string;
  email?: string | null;
  phone?: string | null;
}): string {
  const name = (input.display_name ?? "").trim();
  if (name) return name;
  const email = (input.email ?? "").trim();
  if (email) return email.split("@")[0] || email;
  const phone = (input.phone ?? "").trim();
  if (phone) return phone;
  return "Coworker";
}

function normCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

async function workerContactsTableAvailable(): Promise<boolean> {
  const { error } = await admin
    .from("worker_onboarding_contacts")
    .select("id")
    .limit(1)
    .maybeSingle();
  return !isMissingTableError(error);
}

async function insertInviteWithColumnFallback(
  row: Record<string, unknown>
): Promise<{ data: { id: string; invite_token: string } | null; error: PostgrestErrorLike }> {
  let payload = { ...row };

  while (Object.keys(payload).length > 0) {
    console.log("[production-safe onboarding contacts]", {
      helper: "insertInviteWithColumnFallback",
      includes_email: "email" in payload,
      includes_phone: "phone" in payload,
    });

    const { data, error } = await admin
      .from("coworker_invites")
      .insert(payload)
      .select("id, invite_token")
      .single();

    if (!error) {
      return { data: data as { id: string; invite_token: string }, error: null };
    }

    if (isMissingColumnError(error)) {
      const column = missingColumnFromError(error);
      if (column && column in payload) {
        delete payload[column];
        continue;
      }
    }

    return { data: null, error };
  }

  return { data: null, error: { message: "Could not insert coworker invite" } };
}

async function deleteDraftCoworkerInvites(userId: string): Promise<PostgrestErrorLike> {
  const withSentFilter = await admin
    .from("coworker_invites")
    .delete()
    .eq("sender_id", userId)
    .eq("status", "pending")
    .is("invite_sent_at", null);

  if (!withSentFilter.error) return null;

  if (isMissingColumnError(withSentFilter.error)) {
    const pendingOnly = await admin
      .from("coworker_invites")
      .delete()
      .eq("sender_id", userId)
      .eq("status", "pending");
    return pendingOnly.error;
  }

  return withSentFilter.error;
}

async function saveToWorkerOnboardingContacts(
  userId: string,
  contacts: OnboardingContactInput[]
): Promise<{ ok: true; count: number } | { ok: false; error: PostgrestErrorLike }> {
  const { error: delErr } = await admin.from("worker_onboarding_contacts").delete().eq("user_id", userId);
  if (delErr) {
    if (isMissingTableError(delErr)) {
      return { ok: false, error: delErr };
    }
    return { ok: false, error: delErr };
  }

  const { error: insErr } = await admin.from("worker_onboarding_contacts").insert(
    contacts.map((c) => ({
      user_id: userId,
      position: c.position,
      display_name: c.display_name,
      email: c.email,
      phone: c.phone,
    }))
  );

  if (insErr) {
    return { ok: false, error: insErr };
  }

  return { ok: true, count: contacts.length };
}

async function saveToCoworkerInvitesDraft(
  userId: string,
  contacts: OnboardingContactInput[],
  job: { id: string; company_name: string }
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const delErr = await deleteDraftCoworkerInvites(userId);
  if (delErr && !isMissingTableError(delErr)) {
    return { ok: false, error: delErr.message ?? "Could not replace saved coworkers" };
  }

  let saved = 0;
  for (const contact of contacts) {
    if (!contact.email && !contact.phone) {
      return { ok: false, error: "Email or phone required for each coworker" };
    }

    const payload: Record<string, unknown> = {
      sender_id: userId,
      invite_token: generateInviteToken(16),
      status: "pending",
      company_normalized: normCompany(job.company_name),
      job_id: job.id,
    };

    if (contact.email) payload.email = contact.email;
    if (contact.phone) payload.phone = contact.phone;

    const { data, error } = await insertInviteWithColumnFallback(payload);
    if (error) {
      const message = String(error.message ?? "");
      if (
        !contact.email &&
        contact.phone &&
        (message.toLowerCase().includes("email") ||
          message.toLowerCase().includes("null value") ||
          isMissingColumnError(error))
      ) {
        return {
          ok: false,
          error:
            "This environment requires an email address for each coworker. Add an email to continue.",
        };
      }
      return { ok: false, error: message || "Could not save coworker" };
    }

    if (!data?.id) {
      return { ok: false, error: "Could not save coworker" };
    }

    saved += 1;
  }

  if (saved < 1) {
    return { ok: false, error: "Could not save coworkers" };
  }

  console.log("production-safe onboarding contacts: saved draft coworker_invites", {
    userId,
    count: saved,
  });

  return { ok: true, count: saved };
}

export async function loadOnboardingContacts(userId: string): Promise<{
  contacts: OnboardingContactRecord[];
  error: PostgrestErrorLike;
}> {
  const tableAvailable = await workerContactsTableAvailable();

  if (tableAvailable) {
    const { data, error } = await admin
      .from("worker_onboarding_contacts")
      .select("id, position, display_name, email, phone, coworker_invite_id")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (error) {
      return { contacts: [], error };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      position: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      coworker_invite_id: string | null;
    }>;

    return {
      contacts: rows.map((row) => ({
        id: row.id,
        position: row.position,
        display_name: row.display_name,
        email: row.email,
        phone: row.phone,
        coworker_invite_id: row.coworker_invite_id,
        inviteSent: row.coworker_invite_id != null,
        storage: "worker_onboarding_contacts" as const,
      })),
      error: null,
    };
  }

  console.log("production-safe onboarding contacts: loading draft coworker_invites fallback");

  const selectWithSent = "id, email, phone, invite_sent_at, created_at";
  const selectMinimal = "id, email, phone, created_at";

  let rows: Array<{
    id: string;
    email: string | null;
    phone: string | null;
    invite_sent_at?: string | null;
    created_at: string;
  }> = [];
  let loadError: PostgrestErrorLike = null;

  const extended = await admin
    .from("coworker_invites")
    .select(selectWithSent)
    .eq("sender_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!extended.error) {
    rows = (extended.data ?? []) as typeof rows;
  } else if (isMissingColumnError(extended.error)) {
    const minimal = await admin
      .from("coworker_invites")
      .select(selectMinimal)
      .eq("sender_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (minimal.error) {
      loadError = minimal.error;
    } else {
      rows = (minimal.data ?? []) as typeof rows;
    }
  } else {
    loadError = extended.error;
  }

  if (loadError) {
    if (isMissingTableError(loadError)) {
      return { contacts: [], error: null };
    }
    return { contacts: [], error: loadError };
  }

  return {
    contacts: rows.slice(0, 2).map((row, index) => ({
      id: row.id,
      position: index + 1,
      display_name: displayNameFromContact(row),
      email: row.email,
      phone: row.phone,
      coworker_invite_id: row.invite_sent_at ? row.id : null,
      inviteSent: Boolean(row.invite_sent_at),
      storage: "coworker_invites" as const,
    })),
    error: null,
  };
}

export async function saveOnboardingContacts(
  userId: string,
  contacts: OnboardingContactInput[],
  job: { id: string; company_name: string } | null
): Promise<
  | { ok: true; count: number; storage: "worker_onboarding_contacts" | "coworker_invites" }
  | { ok: false; error: string }
> {
  const tableAvailable = await workerContactsTableAvailable();

  if (tableAvailable) {
    const result = await saveToWorkerOnboardingContacts(userId, contacts);
    if (result.ok) {
      return { ok: true, count: result.count, storage: "worker_onboarding_contacts" };
    }
    if (!isMissingTableError(result.error)) {
      return { ok: false, error: result.error?.message ?? "Could not save coworkers" };
    }
  }

  console.log("production-safe onboarding contacts: retrying with coworker_invites draft storage");

  if (!job?.id) {
    return { ok: false, error: "Add a job before saving coworkers" };
  }

  const fallback = await saveToCoworkerInvitesDraft(userId, contacts, job);
  if (!fallback.ok) {
    return fallback;
  }

  return { ok: true, count: fallback.count, storage: "coworker_invites" };
}

export async function countOnboardingContacts(userId: string): Promise<{
  count: number;
  error: PostgrestErrorLike;
}> {
  const tableAvailable = await workerContactsTableAvailable();

  if (tableAvailable) {
    const { count, error } = await admin
      .from("worker_onboarding_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      if (isMissingTableError(error)) {
        return countOnboardingContactsFromInvites(userId);
      }
      return { count: 0, error };
    }

    return { count: count ?? 0, error: null };
  }

  return countOnboardingContactsFromInvites(userId);
}

async function countOnboardingContactsFromInvites(userId: string): Promise<{
  count: number;
  error: PostgrestErrorLike;
}> {
  const { count, error } = await admin
    .from("coworker_invites")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (error) {
    if (isMissingTableError(error)) return { count: 0, error: null };
    return { count: 0, error };
  }

  return { count: count ?? 0, error: null };
}

export async function linkContactToInvite(
  contact: OnboardingContactRecord,
  inviteId: string
): Promise<MutateResult> {
  if (contact.storage !== "worker_onboarding_contacts") {
    return { data: null, error: null };
  }

  const tableAvailable = await workerContactsTableAvailable();
  if (!tableAvailable) {
    return { data: null, error: null };
  }

  const { data, error } = await admin
    .from("worker_onboarding_contacts")
    .update({ coworker_invite_id: inviteId })
    .eq("id", contact.id);

  return { data, error };
}
