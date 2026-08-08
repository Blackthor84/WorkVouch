# Connection Wizard

Six-step wizard for connecting Greenhouse without developer assistance.

## Route

```
/employer/integrations/connect
```

## Steps

| Step | ID | Description |
|------|-----|-------------|
| 1 | `provider` | Choose provider (Greenhouse) |
| 2 | `authorize` | Start OAuth — redirects to Greenhouse |
| 3 | `validate` | Confirm connection after OAuth callback |
| 4 | `preview` | Run preview import (1 page) |
| 5 | `automation` | Configure invite trigger and delay |
| 6 | `finish` | Success — link to provider details |

## OAuth flow

1. Employer clicks **Continue to Greenhouse**
2. `POST /api/employer/integrations/connect/greenhouse` returns `authorizationUrl`
3. Browser redirects to Greenhouse OAuth
4. Greenhouse redirects to `GET /api/integrations/v1/connect/greenhouse/callback`
5. Callback completes token exchange and redirects to:
   ```
   /employer/integrations/connect?step=validate&connected=greenhouse&connectionId={uuid}
   ```

## API

```
POST /api/employer/integrations/connect/greenhouse
→ { connectionId, authorizationUrl, status }
```

## Automation defaults

Wizard step 5 saves to connection metadata:

```json
{
  "auto_invite_enabled": true,
  "auto_invite_trigger": "final_interview",
  "auto_invite_delay_hours": 0
}
```

Via `PATCH /api/employer/integrations/connections/{id}/settings`.

## Error handling

OAuth errors redirect to:

```
/employer/integrations/connect?error={message}
```

Displayed as a red alert at the top of the wizard.
