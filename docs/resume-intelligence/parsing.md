# Parsing

## Endpoint

`POST /api/resume/parse` with body `{ "path": "<storage-key>" }`

## Pipeline

1. Path ownership check (`isResumePathOwnedByUser`)
2. Rate limit: 3 parses per user per day (audit_logs)
3. Download from `resumes` bucket
4. Text extraction (`lib/resume/extract-text.ts`)
   - PDF: pdf-parse
   - DOC/DOCX: mammoth
   - TXT: UTF-8
5. OpenAI `gpt-4o-mini` structured JSON
6. Normalize dates, dedupe jobs
7. Duplicate hints against existing `employment_records`

## Response

```json
{
  "identity": { "full_name": { "value": "...", "confidence": "high", "source": "resume" } },
  "employment": [ { "client_id": "...", "company_name": "...", "confidence": "high", ... } ],
  "parse_status": "complete | partial | no_employment",
  "warnings": []
}
```

## Confidence

Numeric model scores map to **High / Medium / Low** for UI. Raw probabilities are not shown to users.

## Privacy

- Street addresses and ZIP codes are stripped from identity/location fields
- Raw resume text is not persisted after parse
- Parser input truncated (~14k chars)

## Failure codes

| Code | Meaning |
|------|---------|
| `UNSUPPORTED_FORMAT` | Extension not supported |
| `EMPTY_FILE` | No extractable text |
| `CORRUPT_FILE` | PDF/DOC unreadable |
| `INSUFFICIENT_TEXT` | Too little content |
| `PARSER_TIMEOUT` | OpenAI timeout |
| `PARSER_UNAVAILABLE` | Missing API key |
