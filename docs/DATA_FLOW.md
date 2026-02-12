# Full Data Flow: Workforce Verification

All real-time. Same logic in sandbox and production.

```
Resume Uploaded
    ↓
Text Extracted (PDF/DOCX – no mock; fail in both envs if extraction fails)
    ↓
AI Parsing (structured JSON: full_name, email, work_history, skills, certifications)
    ↓
Stored (workforce_resumes.raw_file_url, workforce_resumes.parsed_json)
    ↓
Organization Match (normalize company names; match to existing orgs/locations)
    ↓
Overlap Detection (same org, same company_normalized, date range overlap)
    ↓
Peer Suggestions (peer_match_suggestions)
    ↓
Reference Requests (workforce_peer_references)
    ↓
Feedback Stored
    ↓
Analytics Updated
    ↓
Enterprise Dashboard Reflects Changes
```

No separate codebase. No mock-only logic. If resume parsing fails in production, it fails in sandbox.
