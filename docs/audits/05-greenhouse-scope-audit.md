# 05 — Greenhouse Scope Audit

**Date:** 2026-08-13  
**Reference:** Partner OAuth guide + Harvest V3 scope model

---

## Scopes Currently Requested (Code)

From `lib/integrations/providers/greenhouse/config/manifest.ts`:

| Scope | Declared | Actually Used |
|-------|----------|---------------|
| `harvest:read` | ✅ OAuth authorize | ✅ All Harvest GET calls |
| `harvest:write` | ✅ OAuth authorize | ❌ **No Harvest write API calls** |
| `harvest:webhooks` | ✅ OAuth authorize | ❌ **No webhook registration API** |

**Note:** These are **legacy coarse scopes**. Greenhouse Harvest V3 partner program uses **granular scopes** such as:

- `harvest:candidates:list`
- `harvest:candidates:retrieve`
- `harvest:jobs:list`
- `harvest:applications:list`
- `harvest:job_posts:list`
- etc.

---

## Minimum Scope Set for WorkVouch MVP (Recommended)

Based on **actual code paths** (read sync + webhooks, no write-back):

| Granular scope (V3) | Purpose | Endpoint / feature | Read/Write | MVP |
|---------------------|---------|-------------------|------------|-----|
| `harvest:candidates:list` | Candidate sync | `GET /v3/candidates` | Read | **Required** |
| `harvest:candidates:retrieve` | Single candidate | `GET /v3/candidates/{id}` | Read | **Required** |
| `harvest:jobs:list` | Job sync | `GET /v3/jobs` | Read | **Required** |
| `harvest:jobs:retrieve` | Single job | `GET /v3/jobs/{id}` | Read | **Required** |
| `harvest:applications:list` | Application sync | `GET /v3/applications` | Read | **Required** |
| `harvest:applications:retrieve` | Single application | `GET /v3/applications/{id}` | Read | **Required** |
| `harvest:users:list` | Health / connection test | User lookup | Read | **Required** (replace `/users/me`) |

### Optional (not currently used)

| Scope | Purpose | MVP |
|-------|---------|-----|
| `harvest:application_stages:list` | Stage history | Optional — improves panel accuracy |
| `harvest:offers:list` | Offer events | Optional — webhook-driven today |
| `harvest:job_posts:list` | Public job posts | Not needed for Connect MVP |
| `harvest:candidates:create` | Write-back | **Future** — not implemented |
| `harvest:applications:create` | Write-back | **Future** |
| `harvest:webhooks:*` | Programmatic webhooks | **Future** — manual Hookshot today |

### Potentially unnecessary (currently requested)

| Scope | Why unnecessary |
|-------|-----------------|
| `harvest:write` (coarse) | No write operations implemented |
| `harvest:webhooks` (coarse) | No webhook API calls |

---

## Scope by Feature

### Candidate synchronization

- **Required:** candidates list + retrieve
- **Webhook:** candidate_created, candidate_updated (no extra Harvest scope if webhook-driven)

### Job synchronization

- **Required:** jobs list + retrieve

### Application synchronization

- **Required:** applications list + retrieve

### Webhook functionality

- **Harvest scope:** None for inbound Hookshot (secret-based HMAC)
- **Partner setup:** Webhook configured in Greenhouse admin, not via OAuth scope

### Candidate updates (future write-back)

- Would require: `harvest:candidates:update`, `harvest:applications:update`, etc.
- **Not in MVP**

---

## Site Admin Requirement (Partner Docs)

Greenhouse states list endpoints may require authorization by a **Site Admin** user. If a non-admin connects, list calls return **403**.

**Product impact:** Employer connect flow should document that a Greenhouse Site Admin must authorize the integration.

---

## Action Items (Pre-Sandbox)

1. Email `partner-support@greenhouse.io` with minimum scope list above
2. Remove `harvest:write` and `harvest:webhooks` from OAuth request until features exist
3. Update `manifest.ts` scopes after Greenhouse approves granular set (engineering sprint — not this audit)
4. Document Site Admin requirement in marketplace installation guide
