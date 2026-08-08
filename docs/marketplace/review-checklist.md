# Marketplace Review Checklist

## For Greenhouse Reviewers

### Installation
- [ ] OAuth connect completes without error
- [ ] Webhook test event received
- [ ] Health dashboard green

### Embedded Experience
- [ ] Panel loads in iframe
- [ ] Hiring Confidence visible
- [ ] Trust score and verification sections render
- [ ] Stale/warning states understandable

### Demo (if live GH unavailable)
- [ ] `?demo=1&scenario=high` — strong candidate
- [ ] `?demo=1&scenario=moderate` — mixed signals
- [ ] `?demo=1&scenario=warning` — low confidence
- [ ] `?demo=1&scenario=not_linked` — invite CTA

### Security
- [ ] Webhook rejects invalid signature
- [ ] Panel token not in URL
- [ ] Employer cannot access other tenant connections

### Documentation
- [ ] overview.md accurate
- [ ] installation-guide.md steps work
- [ ] security.md matches implementation
- [ ] privacy.md complete

### Support
- [ ] Diagnostic bundle downloads
- [ ] support contact documented

## WorkVouch Internal Sign-Off

- [ ] PRODUCTION_READINESS_REPORT.md go/no-go
- [ ] All P0 security items resolved
- [ ] Release checklist complete
- [ ] CHANGELOG updated
