/**
 * Runtime flags for environment and fake/demo data.
 * Production = real data only. Sandbox/Preview = fake/demo allowed.
 *
 * Any API or server code that returns fake/demo content (notifications,
 * seeded activity, demo feeds) MUST check allowFakeData at the start
 * and return null or empty when false. Server-enforced only.
 */

export const isSandbox =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_APP_ENV === "sandbox";

export const allowFakeData =
  isSandbox ||
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_PREVIEW_MODE === "true");
