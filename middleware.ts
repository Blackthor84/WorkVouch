/**
 * Next.js entry point for middleware. All logic lives in proxy.ts (Next 16 single-middleware pattern).
 * Do not add logic here — keeps one source of truth and avoids duplicate middleware.
 */
export { default, config } from "./proxy";
