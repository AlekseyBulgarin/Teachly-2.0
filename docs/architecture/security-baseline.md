# Security Baseline

This is a design baseline, not a compliance certification. CIS-specific legal and regulatory requirements require later specialist review.

## Identity and Sessions

Use a well-maintained authentication approach with secure password hashing if passwords are supported, email/identity verification, recovery protections, session expiry, revocation, and device/session visibility. Store secrets in managed secret storage. Prefer secure, HttpOnly, SameSite cookies for browser sessions where compatible.

## Authorization and Isolation

Authorization is deny-by-default and checks resource ownership, organization membership, teacher/student relationships, guardian scope, and platform-admin privileges. Every organization-owned record carries an explicit tenant context. Queries must scope before returning data; tests must attempt cross-tenant access.

Guardian access is a separate relationship with explicit status, consent policy, allowed data categories, and primarily read-only permissions.

## Web and API Controls

- TLS in transit and encryption at rest through managed providers.
- CSRF protection for cookie-authenticated state changes.
- Output encoding and safe rendering to reduce XSS.
- Parameterized queries/ORM protections against SQL injection.
- Strict DTO validation and request size limits.
- CORS allowlists and security headers.
- Rate limits and abuse detection for authentication, submissions, uploads, and AI.

## Content and Files

Treat imported content and uploads as untrusted. Validate type, size, encoding, and structure; scan where appropriate; store outside executable paths; use private buckets and short-lived signed access. Preserve source and license metadata. Do not publish unmoderated external HTML or scripts.

## Minors, PII, Retention, and Deletion

Minimize collection of child data, restrict staff access, log sensitive reads, and define retention/deletion behavior before launch. Account deletion must specify what is deleted, anonymized, retained for audit, or retained because it is needed for another user's records. Jurisdiction-specific requirements for CIS markets remain unresolved.

## Assessment Integrity

Record attempt start/end and relevant state transitions server-side. Do not trust client timers or scores. Treat exam security as a product decision; initial MVP should describe itself as practice/teacher assessment if anti-cheating controls are insufficient. Strong proctoring is not assumed.

## AI Safety and Data Handling

AI context is minimized and purpose-bound. User content is separated from system instructions, and external content is treated as potentially adversarial prompt input. Validate model output, apply safety filters, cap cost and rate, and record provider/model/policy metadata. AI cannot modify permissions, scoring, mastery, billing, or assessment state.

## Audit and Operations

Audit sensitive authorization, membership, publication, moderation, assessment, deletion, and AI data-access actions. Logs must avoid raw credentials, tokens, unnecessary PII, and full sensitive answers. Maintain incident response, backups, restoration testing, dependency updates, and access reviews as implementation prerequisites.

## Threats Deferred for Explicit Decision

Code execution sandboxes, formal exam proctoring, advanced plagiarism detection, and provider-specific data retention require separate threat models before implementation.
