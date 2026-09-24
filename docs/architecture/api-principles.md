# API Principles

## Style

Use REST for the initial internal and application API, documented with OpenAPI. Resources represent stable domain concepts; commands are used where an operation is not naturally a CRUD update, such as starting an attempt, submitting an answer, publishing content, or assigning homework.

GraphQL is not required initially. It may be evaluated later for read-heavy integration or product needs, but it must not bypass module authorization or domain invariants.

## Resource Boundaries

API resources mirror capability boundaries rather than database tables. An endpoint returns a purpose-specific DTO, not an ORM entity. Input validation occurs at the boundary and business validation occurs in the domain application service.

Conceptual groups include authentication, users, organizations, students, teachers, content, imports, tasks, attempts, training, learning, assessments, homework, analytics, notifications, and AI.

## Authentication and Authorization

Authentication identifies the principal. Every protected operation then evaluates:

1. actor identity;
2. organization context, if applicable;
3. direct teacher/student/guardian relationship;
4. resource ownership and permission scope;
5. action-specific policy.

Never infer authorization from client-provided organization IDs or a global user role.

## Requests and Errors

- Validate request body, path, query, and headers with explicit schemas.
- Use stable error codes and safe messages.
- Do not expose provider, SQL, prompt, or secret details.
- Return correlation IDs for support and observability.
- Distinguish authentication failure, authorization failure, validation failure, conflict, rate limit, and dependency failure.

## Pagination and Querying

Collection APIs use bounded pagination. Cursor pagination is preferred for event-like or changing lists; page-based pagination may be adequate for stable administrative lists. Filtering and sorting are allowlisted per resource and must be scoped before query execution.

## Idempotency and Concurrency

Use idempotency keys for answer submission, assignment creation where retries are likely, imports, and other externally retried commands. State transitions use server-side checks and optimistic concurrency/version conditions where needed. A client retry must not create duplicate attempts or assignments.

## Versioning

Keep one evolving internal API until compatibility pressure exists. External API versions, when introduced, must be explicit and supported by contract tests. Content/task versioning is separate from HTTP API versioning.

## Rate Limiting

Apply limits by principal, organization, IP, and expensive operation. AI, imports, login, answer submission, and file operations require tighter policies. Redis may support distributed counters later; PostgreSQL remains authoritative for business state.

## Future Public API

Future integration APIs should have separate credentials, scopes, tenant mappings, quotas, webhook signing, replay protection, and deprecation policy. Internal module interfaces must remain clean without prematurely freezing a public contract.
