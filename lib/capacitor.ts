/**
 * Safe checks for Capacitor/native and SSR.
 * Use in client components only; never during server render.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
