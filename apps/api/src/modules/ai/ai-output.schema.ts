import { z } from 'zod';
import type { GroundedRemediationOutput } from './ai.types';

export const groundedRemediationOutputSchema = z.object({
  summary: z.string().min(1).max(500),
  explanation: z.string().min(1).max(2_000),
  hint: z.string().min(1).max(1_000),
  likelyGap: z.string().min(1).max(500).nullable(),
  evidenceRefs: z.array(z.string()).max(20),
  knowledgeRefs: z.array(z.string()).max(20),
  confidence: z.number().min(0).max(1),
  abstained: z.boolean(),
}).strict().superRefine((output, ctx) => {
  if (output.abstained && output.confidence !== 0) {
    ctx.addIssue({ code: 'custom', path: ['confidence'], message: 'Abstained remediation must have zero confidence' });
  }
  if (!output.abstained && output.evidenceRefs.length === 0 && output.knowledgeRefs.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['evidenceRefs'], message: 'Remediation must cite grounding or abstain' });
  }
});

export type ValidatedGroundedRemediationOutput = GroundedRemediationOutput;

export const groundedRemediationJsonSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 500 },
    explanation: { type: 'string', minLength: 1, maxLength: 2_000 },
    hint: { type: 'string', minLength: 1, maxLength: 1_000 },
    likelyGap: { type: ['string', 'null'], maxLength: 500 },
    evidenceRefs: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    knowledgeRefs: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    abstained: { type: 'boolean' },
  },
  required: ['summary', 'explanation', 'hint', 'likelyGap', 'evidenceRefs', 'knowledgeRefs', 'confidence', 'abstained'],
  additionalProperties: false,
} as const;
