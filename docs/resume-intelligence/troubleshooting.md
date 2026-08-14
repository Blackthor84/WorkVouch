# Troubleshooting

## Upload fails

- Confirm signed in as employee/user role
- Check file type (PDF, DOC, DOCX, TXT) and size ≤ 5MB
- Retry; check Supabase storage bucket `resumes` exists

## Parse returns empty employment

- Scanned PDFs may have no text layer — try DOCX or TXT
- Add jobs manually in review screen
- Check daily parse limit (3/day)

## "Invalid file path"

- Re-upload; use `path` from upload response, not full URL
- Path must start with `{your-user-id}-`

## Confirm fails validation

- Start/end dates must be `YYYY-MM-DD`
- At least one employment row or profile apply required

## Duplicate jobs

- Use **Keep existing**, **Update existing**, or **Create separate** on flagged rows

## Verification not starting

- Go to Dashboard → verification modal, or `/dashboard?openVerification=1`

## Parser unavailable

- `OPENAI_API_KEY` must be set in environment
- Add employment manually if parser is down

## Deleted resume but jobs remain

- Expected: verified/pending employment is independent of source file
