/**
 * Next.js middleware entry. Delegates to proxy for Supabase auth refresh and impersonation.
 * The proxy refreshes the session (getUser) and sets cookies so they stay valid across requests.
 */
export { proxy as default, config } from "./proxy";
