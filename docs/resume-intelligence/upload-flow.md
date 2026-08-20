# Upload Flow

## Canonical contract

| Item | Value |
|------|--------|
| HTTP | `POST /api/resume/upload` |
| Form field | `resume` |
| Response | `{ success: true, path: string, url: string }` |
| `path` | Storage object key (e.g. `userId-1700000000.pdf`) |
| `url` | Profile reference (`resumes/{path}`) |

## Supported formats

- PDF, DOC, DOCX, TXT
- Max size: 5 MB
- Auth: employee/user role only

## Validation

1. Authentication via `getEffectiveUserId`
2. Impersonation write rejection
3. Extension allowlist
4. Size limit
5. Private bucket upload (no public URL)

## Client flows

- **Import resume** (`/dashboard/import-resume`): upload + parse in one step
- **Profile upload** (`UploadResumeForm`): upload only; user may import separately

## Errors & recovery

| Error | Recovery |
|-------|----------|
| Unauthorized | Sign in |
| Invalid type | Choose PDF/DOC/DOCX/TXT |
| Too large | Compress or split content |
| Storage failure | Retry upload |

## Legacy

`POST /api/resume-upload` returns **410 Gone**. Use `/api/resume/upload`.
