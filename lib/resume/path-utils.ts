import { RESUME_BUCKET } from "./types";

/** Profile column value: resumes/{storageKey} */
export function toProfileResumeUrl(storagePath: string): string {
  return `${RESUME_BUCKET}/${storagePath}`;
}

/** Parse profile resume_url or raw path into bucket storage key */
export function toStoragePath(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith(`${RESUME_BUCKET}/`)) {
    return trimmed.slice(`${RESUME_BUCKET}/`.length);
  }
  return trimmed;
}

/** Ensure user owns this storage object key */
export function isResumePathOwnedByUser(path: string, userId: string): boolean {
  if (path.includes("..")) return false;
  if (path.startsWith("sandbox/")) return true;
  return path.startsWith(`${userId}-`) || path.startsWith(`${userId}/`);
}
