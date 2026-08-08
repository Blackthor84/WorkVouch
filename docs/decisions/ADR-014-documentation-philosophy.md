# ADR-014: Documentation Philosophy

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

Five planning sprints produced 84 documents across architecture, integration design, product experience, integration contracts, MVP definition, and ADRs. Documentation must remain useful during engineering without becoming stale or burdensome.

---

## Decision

Adopt these documentation principles:

1. **Design before code** — All architecture, contracts, and UX documented before implementation (completed in Sprints 1–2.9)
2. **Docs are the spec** — Engineering implements from docs; discrepancies require ADR, not silent deviation
3. **One source of truth per topic** — Domain model in 01-domain-model; field mapping in 02-field-mapping; no duplication
4. **ADRs for decisions** — Any architecture change requires a new ADR; existing ADRs are immutable (supersede, don't edit)
5. **Customer-facing docs separate** — Internal specs in `docs/`; public guides in product docs site (not yet created)
6. **Docs include acceptance criteria** — Every feature spec has testable success criteria
7. **Diagrams over prose** — Sequence diagrams, state machines, and ER diagrams preferred for flows
8. **No docs in code comments** — Business logic docs live in `docs/`; code comments explain non-obvious implementation only
9. **Version docs with sprints** — Each doc header includes sprint number and last updated date
10. **Living docs for ops** — Runbooks and troubleshooting guides updated after launch based on real incidents

---

## Consequences

**Positive:**
- Engineering team can implement without meetings to clarify requirements
- 84 planning documents eliminate ambiguity before Sprint 3
- ADRs prevent re-debate of settled decisions
- New team members onboard from docs, not tribal knowledge

**Negative:**
- Documentation maintenance burden (84 docs to keep current)
- Risk of docs diverging from implementation if not updated
- Over-documentation for simple changes (ADR overhead)

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Code-as-documentation | Insufficient for cross-system contracts; GH integration spans two systems |
| Minimal docs, maximum meetings | Doesn't scale; knowledge lost when team members leave |
| Auto-generated docs from code | Doesn't capture design intent, decisions, or UX rationale |
| Wiki (Notion/Confluence) | Not version-controlled; not in repo; diverges from code |

---

## Future Impact

- Public documentation site created before marketplace submission
- Docs updated when V2 features ship (not retroactively)
- ADR count grows but each ADR is short and focused

---

## Related

- [engineering-charter.md](./engineering-charter.md)
- [docs/mvp/10-final-go-no-go.md](../mvp/10-final-go-no-go.md)
