# Feature Flags (Hidden Features) – Production

Feature flags control visibility of hidden features. Only **Admin** and **SuperAdmin** can see the Hidden Features section. All checks are enforced **server-side**; the frontend hook calls a secure API that wraps `checkFeatureAccess`.

## Roles (authority from `user_roles` via NextAuth session)

- **Admin**: View Hidden Features. Assign feature to user/employer **only when** `feature.is_globally_enabled = false`. Cannot create, delete, or change `required_subscription_tier`.
- **SuperAdmin**: Create, edit, delete features; toggle `is_globally_enabled`; set `required_subscription_tier`; assign to users or employers.

## Global activation

- **is_globally_enabled = true** → Feature bypasses assignment checks; active for all qualified users (still respects `required_subscription_tier` if set).
- **is_globally_enabled = false** → Only active if an assignment exists for that user/employer and `enabled = true`.
- No assignment → Feature remains hidden.

## Tier enforcement

If `required_subscription_tier` is set, access is validated against:

- **employer_accounts.plan_tier** (for employer context), or  
- **user_subscriptions.tier** (for user context; active/trialing only).

If the user/employer does not meet the required tier, access is denied even when globally enabled.

## Frontend: Conditional rendering

Use the hook (calls secure API; result is cached client-side for 1 minute):

```tsx
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

function MyComponent() {
  const canUseRehire = useFeatureFlag("rehire_indicator");
  if (!canUseRehire) return null;
  return <RehireIndicator />;
}
```

With loading state:

```tsx
import { useFeatureFlagWithLoading } from "@/lib/hooks/useFeatureFlag";

const { enabled, loading } = useFeatureFlagWithLoading("rehire_indicator");
if (loading) return <Skeleton />;
if (!enabled) return null;
return <RehireIndicator />;
```

## Server-side: `checkFeatureAccess`

Use in API routes, server components, and critical data-fetching logic. Never rely on frontend-only checks.

```ts
import { checkFeatureAccess } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/auth";

const user = await getCurrentUser();
const allowed = await checkFeatureAccess("rehire_indicator", {
  userId: user?.id ?? null,
  uiOnly: false, // true = only allow when visibility is UI/both
});
if (!allowed) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
// ... return feature data
```

Do **not** include hidden feature data in API responses unless access is granted via `checkFeatureAccess`.

## Visibility

- **ui**: Visible in app when enabled.
- **api**: Only accessible via API when enabled.
- **both**: UI and API when enabled.

## Initial features to support (by key)

- `rehire_indicator`
- `reference_consistency`
- `stability_index`
- `workforce_risk_indicator`
- `ai_reference_summary`
- `integrity_index`

Create these in Admin → Hidden Features (SuperAdmin only).
