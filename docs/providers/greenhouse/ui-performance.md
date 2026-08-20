# Greenhouse Panel — UI Performance

## Targets

| Metric | Target |
|--------|--------|
| Panel load (data available) | < 500ms |
| Demo payload generation | < 50ms |
| API response (cached) | < 3s |
| API response (fresh) | < 8s |

## Optimizations

### Lazy Loading

Heavy sections load via `next/dynamic`:

- `EmploymentTimeline`
- `ReferenceSummary`
- `CandidateInsights`

Initial render shows trust, verification, and workflow immediately.

### Skeleton Loading

- `PanelHeaderSkeleton` — full panel initial load
- `PanelSectionSkeleton` — per lazy section
- `PanelTrustSkeleton` — trust score placeholder

### Optimistic Refresh

Refresh button triggers re-fetch without clearing existing data — panel stays visible during refresh with spinning icon.

### Caching

API response headers:

```
Cache-Control: private, max-age=60
X-Panel-Generated-At: {iso}
```

Client uses `cache: "no-store"` on refresh; browser may cache for 60s on initial load.

### Bundle Size

Panel page is isolated at `/integrations/greenhouse/panel` — does not load employer dashboard or Connect admin UI.

Light theme CSS is inline via Tailwind — no additional theme bundle.

## Measurement

`hiringIntelligence.processingTimeMs` included in panel payload for support diagnostics.

Demo payload benchmark in `connect-sprint9-greenhouse-panel.test.ts`.

## Regression Checklist

- [ ] Panel loads in 360px iframe
- [ ] Lazy sections don't block first paint
- [ ] Refresh completes without flash of empty state
- [ ] Demo mode works without auth
- [ ] JWT panel auth validates in < 10ms
