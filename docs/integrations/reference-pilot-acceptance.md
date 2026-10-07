# Reference pilot acceptance

This checklist separates a runnable reference integration from a customer-validated pilot. Record evidence and an owner for every accepted row.

## Technical gate

- [ ] Consumer checks pass at the reviewed commit and preflight reports no missing scopes.
- [ ] The API key exists only in the partner server secret store, with an owner and rotation date.
- [ ] The external learner ID is pseudonymous and stable inside the partner integration.
- [ ] Replaying one pilot run ID returns the same logical Trainer session.
- [ ] Profile, progress, skills, and activity return the expected tenant-scoped data.
- [ ] AI-disabled behavior preserves deterministic evaluation.
- [ ] Enabled AI cites approved evidence or abstains and never changes scoring.
- [ ] Request IDs are retained in partner and Teachly diagnostics.

## Product and legal gate

- [ ] Customer sponsor, engineer, teacher reviewer, and Teachly owner are named.
- [ ] Subject, cohort, dates, baseline, and success criteria are agreed.
- [ ] Data categories, consent/lawful basis, residency, retention, deletion, and subprocessors are approved.
- [ ] Knowledge licenses and external-AI permissions are documented.
- [ ] Support hours, severity levels, escalation contacts, and exit criteria are agreed.
- [ ] Infrastructure costs and the zero-margin pilot boundary are written down.

Attach the secret-free preflight report, contract commit, smoke output, rollback rehearsal, security review, teacher results, and go/no-go decision. Until then, call this a **reference pilot implementation**, not a completed customer pilot.
