import { normalizeToE164 } from "@/lib/invites/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedContact = {
  email: string | null;
  phone: string | null;
  /** Raw value stored in public.invites.contact */
  contact: string;
};

/** Parse a stored `invites.contact` value into email and/or phone. */
export function parseContactField(contact: string | null | undefined): {
  email: string | null;
  phone: string | null;
} {
  const raw = (contact ?? "").trim();
  if (!raw) return { email: null, phone: null };

  if (raw.includes("@") && EMAIL_RE.test(raw.toLowerCase())) {
    return { email: raw.toLowerCase(), phone: null };
  }

  const phone = normalizeToE164(raw);
  return { email: null, phone: phone ?? raw };
}

/** Build the single `contact` column from email and/or phone (email preferred). */
export function buildContactField(email: string | null | undefined, phone: string | null | undefined): string | null {
  const emailRaw = (email ?? "").trim().toLowerCase();
  if (emailRaw && EMAIL_RE.test(emailRaw)) {
    return emailRaw;
  }

  const phoneRaw = (phone ?? "").trim();
  if (phoneRaw) {
    return normalizeToE164(phoneRaw) ?? phoneRaw;
  }

  return null;
}

export function displayNameFromContactValue(contact: string | null | undefined): string {
  const { email, phone } = parseContactField(contact);
  if (email) return email.split("@")[0] || email;
  if (phone) return phone;
  return "Coworker";
}

export function isValidEmail(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v.length > 0 && EMAIL_RE.test(v);
}
