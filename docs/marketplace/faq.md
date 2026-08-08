# FAQ

## General

**Q: Does WorkVouch modify Greenhouse data?**  
A: By default, WorkVouch reads from Greenhouse and displays data in the embedded panel. Write-back is not part of the MVP.

**Q: How are candidates linked?**  
A: Email address match between Greenhouse candidate and WorkVouch profile.

**Q: What if the candidate has no WorkVouch profile?**  
A: Panel shows "Not linked" with option to invite (if automation enabled).

## Trust & Confidence

**Q: What is Hiring Confidence?**  
A: A 0–100 presentation score combining verification status, reference consensus, and profile completeness. It does not replace human judgment.

**Q: Can we customize trust weights?**  
A: Not in MVP. Trust Engine scoring is platform-controlled.

## Technical

**Q: What webhooks are required?**  
A: At minimum candidate and application events. See installation guide.

**Q: How often does sync run?**  
A: Incremental sync via cron; cursor-based, not full re-import each run.

**Q: Is demo mode available for reviewers?**  
A: Yes — set `CONNECT_DEMO_MODE_ENABLED=true` and use `/integrations/greenhouse/panel?demo=1&scenario=high`.

**Q: Multi-region deployment?**  
A: Single-region MVP; rate limit store is in-memory (Redis recommended for scale).

## Billing

Connect availability may depend on employer plan — contact sales.
