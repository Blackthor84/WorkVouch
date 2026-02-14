/**
 * Environment flags. Production = real data only. Sandbox = full power, isolated.
 */

export const IS_SANDBOX =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_APP_MODE === "sandbox";
