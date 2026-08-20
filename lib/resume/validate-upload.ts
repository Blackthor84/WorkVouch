import {
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_MAX_BYTES,
  RESUME_UPLOAD_FIELD,
} from "./types";

export { RESUME_UPLOAD_FIELD };

export function validateResumeFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Missing resume file" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !RESUME_ALLOWED_EXTENSIONS.includes(ext as (typeof RESUME_ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: "Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed.",
    };
  }

  if (file.size > RESUME_MAX_BYTES) {
    return { ok: false, error: "File size exceeds 5MB limit." };
  }

  return { ok: true };
}

export function resumeContentType(ext: string): string {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}
