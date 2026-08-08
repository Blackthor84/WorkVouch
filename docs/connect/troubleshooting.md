# WorkVouch Connect — Troubleshooting

## Event not found

**Symptom:** `inspectEvent` returns undefined

**Fix:** Event may not have been recorded via `connect.recordReceived()` / `captureTranslation()`. Ensure webhook handler uses ConnectPlatform.

## Replay fails in simulation

**Symptom:** `simulateReplay` returns `success: false`

**Fix:** Check original event was successfully captured. Inspect `validation` on the stored record.

## Duplicate event detected

**Symptom:** Translation not published, validation shows DUPLICATE_EVENT

**Fix:** Expected for idempotent webhook delivery. Use `inspectEvent` to confirm original was processed. Do not replay with live mode unless from DLQ.

## Invalid payload

**Symptom:** MALFORMED_PAYLOAD validation error

**Fix:** Run `connect.validatePayload(raw)` before translation. Compare with fixtures in `fixtures/replay/`.

## Provider disabled

**Symptom:** Diagnostics shows provider enabled=false

**Fix:** Set `ATS_ENABLED=true` and `{PROVIDER}_ENABLED=true`.

## No timeline stages

**Symptom:** Empty timeline

**Fix:** Ensure `captureTranslation()` and `captureConsumed()` were called after processing.

## 2-minute incident response checklist

1. Get correlation ID from ticket
2. `connect.exploreCorrelation(correlationId)`
3. `connect.inspectEvent(eventId)`
4. Check validation errors and audit trail
5. `connect.simulateReplay(eventId)` to reproduce safely
