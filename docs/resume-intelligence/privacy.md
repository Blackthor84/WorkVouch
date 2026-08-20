# Privacy

## Address handling

Resumes often contain full addresses. WorkVouch:

- Extracts city, state, country for user review
- **Does not** store street address or ZIP from resumes
- **Does not** expose granular address to employers or Greenhouse

## Location policy alignment

Heat maps and analytics use **country + US state** aggregation only. Resume location fields follow the same minimization principle for storage.

## Who can see what

| Data | User | Employer | Greenhouse panel |
|------|------|----------|------------------|
| Resume file | Signed URL (1h) | On request flow only | Not exposed |
| Parsed city/state | Profile if confirmed | Profile visibility rules | Not address-level |
| Pending employment | Yes | After visibility rules | Verified summary only |
| Verified employment | Yes | Yes | Trust/verification cards |

## Excluded from Trust

- Unverified / pending resume claims
- Street-level address data (never stored)

## Deletion

Deleting a resume (`DELETE /api/resume`) removes the file and profile reference. **Verified employment is not deleted** — it is an independent WorkVouch record.
