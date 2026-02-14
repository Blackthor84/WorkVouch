# Internal Analytics, Intelligence & Alerting — Master Spec

**Enterprise, admin-only, security-critical. Not marketing analytics.**

Quality bar: Stripe / Airbnb / LinkedIn / Meta internal dashboards.  
When in doubt: **safety, privacy, and operational control** over convenience.

---

## 1. Non-Negotiable Rules

| Rule | Implementation |
|------|----------------|
| **Admin sees everything (legally)** | All analytics APIs require admin; RLS/service role. No PII in analytics tables (hashed IP, no keystrokes/replay). |
| **Sandbox full parity with production** | Same views, same APIs, same schema. Filter by `is_sandbox`. Sandbox Analytics route mirrors prod views. |
| **Sandbox data never mixes with prod** | Every table has `is_sandbox`; every query filters by env. UI defaults to current env; "All" is explicit. |
| **Every admin view & alert auditable** | VIEW_ANALYTICS → admin_audit_logs (section). Alert ack/dismiss/silence → admin_audit_logs. Export → audit. |
| **No silent failures** | Capture returns 500 on write failure. Alert dispatch logs failures to admin_alert_deliveries. Audit write failure can block action (admin ops) or log and continue (view-only per product). |
| **Fail closed, not permissive** | Admin access enforced server-side. UI is useless without backend enforcement. |
| **Privacy-safe (GDPR/CCPA)** | No raw IP (hash only). No session replay, no keystrokes. Do Not Track respected (see below). Sampling only for heatmaps. |
| **Admin UI useless without backend** | All routes require getAdminContext/requireAdmin; APIs use requireAdminForApi. |

---

## 2. Global Admin UX

- **Top bar:** 🔒 ADMIN MODE \| ENV: **PROD** (red) or 🧪 **SANDBOX** (yellow) \| ROLE \| EMAIL  
- **Sandbox:** Visually impossible to confuse: amber/yellow theme, "SANDBOX" labels, optional sticky sub-bar.  
- **Sidebar:** Dashboard; **Analytics** (Overview, Real-Time, Geography, Funnels, Heatmaps, User Journeys, Abuse & Security, Sandbox Analytics); Alerts; Audit Logs; System Settings (superadmin only).

---

## 3. Analytics Screens (Summary)

| Screen | Route | Purpose |
|--------|--------|---------|
| Overview | `/admin/analytics/overview` | Executive snapshot: active users, new users, conversion, error rate, abuse count, sandbox ratio; clickable widgets → deep view. |
| Real-Time | `/admin/analytics/real-time` | Live visitors, page view stream, events; SSE; sandbox vs prod. |
| Geography | `/admin/analytics/geography` | Map or table; country → region → city; filters: time, auth, env. |
| Funnels | `/admin/analytics/funnels` | Landing→Signup→Profile→Employer; drop-off %; sandbox vs prod comparison. |
| Heatmaps | `/admin/analytics/heatmaps` | Click density, scroll depth, exit points. No replay, keystrokes, PII. |
| User Journeys | `/admin/analytics/journeys` | Search by session/user; timeline (page views, events, errors); trust score at time. |
| Abuse & Security | `/admin/analytics/abuse` | Rapid refresh, scraping, VPN, multi-account, geo anomalies, sandbox misuse; severity. |
| Sandbox Analytics | `/admin/analytics/sandbox` | Same views; forced sandbox env; yellow theme; "NO PROD DATA" labeling. |

---

## 4. Alerting (Summary)

- **Types:** Security (VPN, scraping, failed login, multi-account); Trust & Safety (trust anomalies, review fraud, employer abuse); System (error spikes, audit/analytics failures); Sandbox (emergency actions, divergence).  
- **Severity:** INFO / WARNING / CRITICAL. Controls UI color, channel, escalation.  
- **Delivery:** In-app (Alerts), email, Slack. CRITICAL → immediate; WARNING → aggregated; INFO → UI only.  
- **Admin UX:** `/admin/alerts` — live feed, filters (severity, type, sandbox/prod), detail view with recommended action and audit link. Escalation until acknowledged; superadmin required to silence CRITICAL.  
- **Implementation:** `admin_alerts`, `admin_alert_deliveries`; `lib/admin/alerts.ts`; abuse → `createAlertFromAbuseSignal`. See `docs/ALERTING_SYSTEM_DESIGN.md`. |

---

## 5. Audit & Compliance

- **Viewing analytics:** Every analytics API call (overview, real-time, geography, funnels, heatmaps, abuse, errors, stream) calls `logAdminViewedAnalytics(admin, req, section)` → `admin_audit_logs` with action_type `VIEW_ANALYTICS`, after_state `{ section }`.  
- **Dismissing/acknowledging alerts:** `writeAdminAuditLog` with `alert_dismissed` / `alert_acknowledged` / `alert_silenced`.  
- **Exporting analytics:** Any export flow (e.g. CSV of analytics data) MUST call audit with action_type `EXPORT_ANALYTICS`, target_type `system`, reason including scope (e.g. "Exported overview 24h").  
- **Sandbox vs prod:** All audit rows include `is_sandbox` from admin context. |

---

## 6. Data & Performance

- **Async, non-blocking:** Analytics capture (page view, event) is synchronous for correctness (fail closed on write); abuse checks and alert creation are fire-and-forget after insert.  
- **Sampling:** Allowed only for heatmaps (e.g. 10% of clicks) to reduce volume. No sampling for sessions, page views, or abuse.  
- **No raw IP:** Hash immediately in capture; store only `ip_hash`.  
- **Do Not Track:** If request header `DNT: 1`, capture endpoint returns success without persisting session or page view (user preference not to be tracked). See implementation in `app/api/analytics/capture/route.ts`.  
- **Admin-only:** All analytics and alert APIs enforce admin server-side; RLS on analytics tables is service-role only. |

---

## 7. Deliverables Checklist

| # | Deliverable | Status / Location |
|---|-------------|-------------------|
| 1 | Full analytics UI wireframes | `docs/ADMIN_ANALYTICS_UI_WIREFRAMES.md` |
| 2 | Admin analytics pages (Next.js) | `app/admin/analytics/*` (overview, real-time, geography, funnels, heatmaps, journeys, abuse, sandbox) |
| 3 | Real-time data transport | SSE `GET /api/admin/analytics/stream`; `AdminAnalyticsDashboard` EventSource |
| 4 | Funnel computation | `GET /api/admin/analytics/funnels`; `app/api/admin/analytics/funnels/route.ts` |
| 5 | Heatmap aggregation | `GET /api/admin/analytics/heatmaps`; privacy-safe, no PII |
| 6 | Abuse detection engine | `lib/analytics/abuse.ts`; `abuse_signals`; alerts from signals |
| 7 | Alert schemas & rules | `docs/ALERTING_SYSTEM_DESIGN.md`; `supabase/migrations/20250301000000_admin_alerts_system.sql` |
| 8 | Alert UI + notification dispatch | `app/admin/alerts`, `lib/admin/alerts.ts` (email, Slack) |
| 9 | Sandbox parity | All views filter by `is_sandbox`; `/admin/analytics/sandbox` forced sandbox + theme |
| 10 | Audit integration | `lib/admin/analytics-audit.ts` (VIEW_ANALYTICS); alert ack/dismiss in `alerts.ts`; export must log |
| 11 | Accessibility & performance | Keyboard nav, aria-labels, live regions for stream; loading/error states; see wireframes doc |

---

## 8. Accessibility & Performance Notes

- **Keyboard:** All interactive elements (tabs, filters, buttons) focusable and activatable via keyboard.  
- **Screen readers:** Severity and env (Sandbox/Prod) not by color alone; labels and aria-live for live stream updates.  
- **Performance:** Heavy queries (overview, funnels) use limit caps; real-time uses SSE (no polling). Loading skeletons and error states with retry.  
- **Export:** If implemented, run server-side with pagination/streaming and log once per export job. |

This document is the single source of truth for the internal analytics and alerting system. Implementations must align with these rules.
