# Installation Guide

## Prerequisites

- WorkVouch employer account with Connect enabled
- Greenhouse admin access
- Greenhouse Harvest API credentials (OAuth app)

## Step 1: Enable Connect

WorkVouch admin sets:

```bash
ATS_ENABLED=true
GREENHOUSE_ENABLED=true
```

## Step 2: Configure Greenhouse OAuth App

1. In Greenhouse Dev Center, create OAuth application
2. Redirect URI: `https://<your-domain>/api/integrations/v1/connect/greenhouse/callback`
3. Scopes: Harvest API read access as required by your integration tier
4. Copy Client ID and Client Secret to WorkVouch env:

```bash
GREENHOUSE_CLIENT_ID=
GREENHOUSE_CLIENT_SECRET=
GREENHOUSE_REDIRECT_URI=https://<your-domain>/api/integrations/v1/connect/greenhouse/callback
```

## Step 3: Configure Webhooks

1. In Greenhouse, create Hookshot webhook
2. URL: `https://<your-domain>/api/integrations/v1/webhooks/greenhouse`
3. Copy signing secret:

```bash
GREENHOUSE_WEBHOOK_SECRET=
```

## Step 4: Connect in Employer Portal

1. Navigate to **Employer → Integrations**
2. Click **Connect Greenhouse**
3. Complete OAuth consent
4. Verify health dashboard shows **Healthy**

## Step 5: Configure Panel (Embedded)

1. In Greenhouse, add custom iframe / partner panel URL
2. Panel URL pattern: `https://<your-domain>/integrations/greenhouse/panel`
3. WorkVouch issues short-lived JWT via server-to-server token endpoint

## Step 6: Verify

- Trigger test webhook (candidate created)
- Confirm event appears in Event Explorer
- Open candidate in Greenhouse — panel loads

## Troubleshooting

See [support.md](./support.md) and employer diagnostic bundle download.
