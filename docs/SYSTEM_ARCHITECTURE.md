# System Architecture: Sandbox vs Production Parity

## Principles

- **Same database schema** for sandbox and production.
- **Same business logic** and **same permission rules** and **same API layer**.
- **Only difference**: `environment` column (`sandbox` | `production`) and data separation.
- If a feature works in production, it must work in sandbox. If it is not production-ready, it must not appear in sandbox.
- **No mock-only logic.** No fake dashboards; no hardcoded display-only data.

## Environment and Data Isolation

- Every table that is environment-aware has an `environment` column.
- **All API and server queries MUST** add `.eq('environment', getEnvironmentFromHeaders(headers))` (or equivalent) so that:
  - Sandbox requests only see and write `environment = 'sandbox'` rows.
  - Production requests only see and write `environment = 'production'` rows.
- No record may be accessible across environment or organization. RLS enforces org/location; application enforces environment.

## Authentication and Environment Selection

- Authentication must allow selecting **Production** or **Sandbox** (e.g. post-login env switcher or URL `?sandbox=true`).
- When in sandbox, all queries are filtered by `environment = 'sandbox'`. Data is isolated; same logic and permissions as production.

## Enterprise Multi-Tenant Structure

### Tables (with environment where applicable)

| Table | Key columns | Environment |
|-------|-------------|-------------|
| organizations | id, name, industry, plan_type | yes |
| locations | id, organization_id, name, city, state | yes |
| departments | id, location_id, name | yes |
| tenant_memberships | user_id, organization_id, location_id, role | yes |
| workforce_employees | organization_id, location_id, full_name, email, profile_id, resume_id, invite_status | yes |
| workforce_resumes | employee_id, raw_file_url, parsed_json | yes |
| workforce_peer_references | employee_id, reviewer_employee_id, rating, written_feedback, visibility_flag | yes |
| workforce_audit_logs | organization_id, user_id, action, metadata | yes |
| location_usage | location_id, period_date, metric_name, metric_value | yes |

### Roles and Permissions

- **super_admin**: Full platform visibility; can switch environment; can impersonate.
- **enterprise_owner**: View all locations; import workers; view all peer references; organization analytics.
- **location_admin**: View only their location; import workers for their location; peer references for that location.
- **recruiter**: View workers; cannot edit billing.
- **employee**: View own resume; see peer feedback about them; leave peer references; cannot see other employees’ private feedback.

## Production Safety Rule

- If resume parsing fails in production, it must fail in sandbox.
- If peer reference visibility is restricted in production, it must be restricted in sandbox.
- Sandbox must not override permission logic.

## Scalability

- Support 1,000+ organizations, 50+ locations each, 10,000+ employees per organization.
- Use indexed foreign keys and row-level security. Prevent cross-org and cross-environment data leakage.

## Implementation Checklist

1. **Every API route** that reads/writes organizations, locations, departments, tenant_memberships, workforce_employees, workforce_resumes, workforce_peer_references, workforce_audit_logs, or location_usage must:
   - Call `getEnvironmentFromHeaders(await headers())` (or receive env from caller).
   - Add `.eq('environment', env)` to all Supabase queries for those tables.
2. **Login / session**: Persist chosen environment (e.g. cookie `app_environment` or URL) so middleware can set `x-app-environment` for server.
3. **Super Admin**: Environment switcher; organization list; impersonation (Enterprise Owner, Location Admin, Employee); billing control; audit logs; abuse detection.
4. **Generate Demo Organization** (sandbox only): Create fake organization, locations, employees, resumes, peer references using **same production logic** (real inserts, no hardcoded display-only data).
