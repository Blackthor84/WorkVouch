# Rate Limiting Configuration

WorkVouch Connect uses a storage-agnostic rate limit abstraction (`lib/rate-limit/`).

## Store Selection

| Priority | Condition | Store |
|----------|-----------|-------|
| 1 | `RATE_LIMIT_STORE=memory` | In-memory (dev/tests) |
| 2 | `RATE_LIMIT_STORE=upstash` or Upstash vars set | Upstash REST |
| 3 | `RATE_LIMIT_STORE=redis` or `REDIS_URL` set | Standard Redis (ioredis) |
| 4 | Default in development | In-memory |
| 5 | Default in production | Upstash (required) |

## Upstash (Recommended for Vercel)

```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
RATE_LIMIT_STORE=upstash
```

Create a free database at [upstash.com](https://upstash.com).

## Standard Redis

```bash
REDIS_URL=redis://user:pass@host:6379
RATE_LIMIT_STORE=redis
```

## Development

In-memory rate limiting is used automatically when no Redis/Upstash vars are set.

```bash
RATE_LIMIT_STORE=memory
```

## Production Requirement

When `ATS_ENABLED=true` and `GREENHOUSE_ENABLED=true` in production, either Upstash or Redis must be configured. Build fails otherwise (see `env.mjs`).

## Connect Route Limits

| Route | Prefix | Limit/min |
|-------|--------|-----------|
| Webhooks | `connect:webhook:` | 300 |
| Panel API | `connect:panel:` | 120 |
| Health | `connect:health:` | 60 |
| Import (cron) | `connect:import:` | 10 |

## Monitoring

Rate limit blocks log `[RATE_LIMIT_BLOCK]` with store name, path, and retry-after.
