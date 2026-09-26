# Approved Knowledge Foundation

## Purpose

The knowledge module provides future AI context assembly with educational material that is authorized, explicitly reviewed, traceable, and versioned. It is not a generic document store or a legal-rights engine.

## Lifecycle

```text
KnowledgeSource
-> KnowledgeDocument
-> raw import
-> immutable normalized document version
-> explicit review decision
-> deterministic chunks
-> bounded approved retrieval
```

Raw content is retained separately from normalized content. Normalization does not overwrite the imported source material. A version is never edited after creation; a later import creates a new version.

## Approval Authority

Only versions with `status = approved` can be returned by the retrieval boundary. Draft, rejected, disabled, and superseded versions are excluded. Approval records the approval timestamp, principal, optional user reference, and note. Approving a replacement supersedes the previously approved version for the document.

Approval is explicit. The presence of a document, version, or chunk never implies that it is safe for student-facing grounding.

## Tenant and Lineage Rules

Every source, document, raw import, version, and chunk belongs to one workspace. Composite foreign keys preserve workspace identity across source, document, raw import, version, and chunk lineage. Service queries require trusted `TenantContext`; request-body tenant identifiers are not used for authorization.

## Provenance and License Status

Retrieval preserves the source, external reference, source reference, raw checksum, normalized checksum, chunk checksum, exact document version, approval reference, and license status.

License status is deliberately limited to:

- `unknown`: no legal conclusion has been recorded;
- `allowed`: an authorized owner or review process recorded allowed reuse;
- `restricted`: reuse is restricted by the recorded policy or source terms.

The system does not infer or automatically classify legal rights.

## Retrieval Boundary

`KnowledgeRetrievalPort` is the persistence-neutral boundary for future AI context assembly. The current implementation uses deterministic relational retrieval only. It requires workspace context, filters to active sources/documents and the current approved version, applies a maximum result limit, and orders results deterministically by source, document, version, and chunk ordinal.

Semantic retrieval, embeddings, vector search, reranking, and external search services are intentionally deferred. They can be added behind the port without changing future AI/domain callers.

## Content Safety

Imported content is stored as data. This phase does not execute or render raw HTML and does not implement prompt-injection defense. Any future rich-text rendering must sanitize at the presentation boundary, and any AI context assembly must treat retrieved content as untrusted context.
