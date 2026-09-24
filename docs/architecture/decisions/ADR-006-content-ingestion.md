# ADR-006: Content Ingestion Pipeline

- **Status:** Accepted for initial implementation

## Context

External task banks are important inputs but may have incompatible formats, uncertain quality, and licensing constraints. Treating them as native content would lose provenance and make moderation difficult.

## Decision

Use explicit stages: raw import, normalization, validation, mapping, moderation, canonical content, and publication. Preserve source identifiers, batches, timestamps, transformation history, licensing metadata, and validation/moderation status.

## Alternatives Considered

- Directly render external source data: rejected because it couples learning and evaluation to unstable sources.
- Manual re-entry only: rejected because it does not scale to the initial content strategy.
- Auto-publish all imports: rejected because legality, quality, and correctness require gates.

## Consequences

The import pipeline is a first-class domain and may need background jobs. Publication is slower than direct display but traceable and safer.
