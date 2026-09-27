import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { aiEvaluationRecords, aiRequests, aiUsageRecords } from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { AI_PROVIDER, type AiProvider } from './ai-provider';
import { AiContextAssembler } from './ai-context-assembler';
import { groundedRemediationOutputSchema } from './ai-output.schema';
import type {
  AiContextReference,
  AiExecutionInput,
  AiExecutionResult,
  GroundedRemediationOutput,
  AiProviderUsage,
} from './ai.types';

const POLICY_VERSION = 'ai-foundation.v1';
const PROMPT_VERSION = 'grounded-remediation.v1';

export class AiRuntimeError extends Error {
  constructor(
    public readonly category: 'invalid_input' | 'idempotency_conflict' | 'in_progress' | 'provider_failure' | 'timeout' | 'invalid_output',
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
  }
}

@Injectable()
export class AiRuntime {
  constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
    private readonly assembler: AiContextAssembler,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  async execute(input: AiExecutionInput): Promise<AiExecutionResult> {
    if (!input.idempotencyKey.trim()) throw new AiRuntimeError('invalid_input', 'An idempotency key is required');
    const context = await this.assembler.assemble(input);
    const requestHash = this.hash({ capability: input.capability, learnerId: input.learnerId, context });
    const existing = await this.findExisting(input);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new AiRuntimeError('idempotency_conflict', 'AI idempotency key conflict', existing.id);
      if (existing.status === 'started') throw new AiRuntimeError('in_progress', 'AI request is already in progress', existing.id);
      if (existing.status === 'failed') throw new AiRuntimeError('provider_failure', existing.failureMessage ?? 'AI request failed', existing.id);
      if (!existing.structuredOutput || !existing.provider || !existing.model) {
        throw new AiRuntimeError('invalid_output', 'AI request has no replayable output', existing.id);
      }
      return {
        requestId: existing.id,
        status: 'succeeded',
        provider: existing.provider,
        model: existing.model,
        output: existing.structuredOutput as GroundedRemediationOutput,
        usage: await this.findUsage(existing.id, input.context.workspaceId),
        replayed: true,
      };
    }

    const request = await this.database.transaction(async () => {
      const [created] = await this.database.db.insert(aiRequests).values({
        workspaceId: input.context.workspaceId,
        learnerId: input.learnerId,
        capability: input.capability,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        policyVersion: POLICY_VERSION,
        promptVersion: PROMPT_VERSION,
        status: 'started',
        contextReferences: context.contextReferences,
        knowledgeReferences: context.contextReferences
          .filter((reference) => reference.type === 'knowledge_chunk')
          .map((reference) => reference.id),
      }).returning();
      if (!created) throw new Error('AI request creation failed');
      await this.audit.record(null, 'ai_request_started', 'ai_request', created.id, {
        capability: input.capability,
      }, input.context.workspaceId);
      return created;
    });

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
    try {
      const response = await this.provider.complete({
        capability: input.capability,
        context,
        policyVersion: POLICY_VERSION,
        promptVersion: PROMPT_VERSION,
      }, controller.signal);
      const output = this.validateOutput(response.output, context.contextReferences);
      const latencyMs = Date.now() - startedAt;
      await this.database.transaction(async () => {
        await this.database.db.update(aiRequests).set({
          status: 'succeeded', provider: response.provider, model: response.model,
          structuredOutput: output, latencyMs, completedAt: new Date(),
        }).where(and(eq(aiRequests.id, request.id), eq(aiRequests.workspaceId, input.context.workspaceId)));
        if (response.usage) await this.insertUsage(request.id, input.context.workspaceId, response.provider, response.model, response.usage);
        await this.database.db.insert(aiEvaluationRecords).values({
          workspaceId: input.context.workspaceId,
          aiRequestId: request.id,
          evaluatorVersion: 'pending.v1',
          status: 'pending',
        });
        await this.audit.record(null, 'ai_request_succeeded', 'ai_request', request.id, {
          provider: response.provider, model: response.model, latencyMs,
        }, input.context.workspaceId);
      });
      return {
        requestId: request.id,
        status: 'succeeded',
        provider: response.provider,
        model: response.model,
        output,
        usage: response.usage ?? null,
        replayed: false,
      };
    } catch (error) {
      const timeoutFailure = controller.signal.aborted;
      const category = timeoutFailure ? 'timeout' : error instanceof OutputValidationError ? 'invalid_output' : 'provider_failure';
      const message = category === 'invalid_output' ? 'AI provider returned an invalid structured response' : category === 'timeout' ? 'AI provider request timed out' : 'AI provider request failed';
      await this.database.transaction(async () => {
        await this.database.db.update(aiRequests).set({
          status: 'failed', failureCategory: category, failureMessage: message,
          latencyMs: Date.now() - startedAt, completedAt: new Date(),
        }).where(and(eq(aiRequests.id, request.id), eq(aiRequests.workspaceId, input.context.workspaceId)));
        await this.audit.record(null, 'ai_request_failed', 'ai_request', request.id, { category }, input.context.workspaceId);
      });
      throw new AiRuntimeError(category, message, request.id);
    } finally {
      clearTimeout(timeout);
    }
  }

  async listRecent(workspaceId: string) {
    const rows = await this.database.db.select().from(aiRequests)
      .where(eq(aiRequests.workspaceId, workspaceId))
      .orderBy(aiRequests.createdAt)
      .limit(20);
    return rows.reverse().map((row) => ({
      requestId: row.id,
      capability: row.capability,
      status: row.status,
      provider: row.provider,
      model: row.model,
      latencyMs: row.latencyMs,
      knowledgeReferences: row.knowledgeReferences,
      outcome: row.structuredOutput
        ? (row.structuredOutput.abstained ? 'abstained' : 'completed')
        : null,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    }));
  }

  private async findExisting(input: AiExecutionInput) {
    const [request] = await this.database.db.select().from(aiRequests).where(and(
      eq(aiRequests.workspaceId, input.context.workspaceId),
      eq(aiRequests.capability, input.capability),
      eq(aiRequests.idempotencyKey, input.idempotencyKey),
    )).limit(1);
    return request;
  }

  private async findUsage(requestId: string, workspaceId: string): Promise<AiProviderUsage | null> {
    const [usage] = await this.database.db.select().from(aiUsageRecords).where(and(
      eq(aiUsageRecords.aiRequestId, requestId), eq(aiUsageRecords.workspaceId, workspaceId),
    )).limit(1);
    return usage ? {
      inputTokens: usage.inputTokens ?? undefined,
      outputTokens: usage.outputTokens ?? undefined,
      totalTokens: usage.totalTokens ?? undefined,
      estimatedCostMicros: usage.estimatedCostMicros ?? undefined,
    } : null;
  }

  private async insertUsage(requestId: string, workspaceId: string, provider: string, model: string, usage: AiProviderUsage): Promise<void> {
    await this.database.db.insert(aiUsageRecords).values({
      workspaceId, aiRequestId: requestId, provider, model,
      inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens, estimatedCostMicros: usage.estimatedCostMicros,
    });
  }

  private validateOutput(value: unknown, references: AiContextReference[]): GroundedRemediationOutput {
    const parsed = groundedRemediationOutputSchema.safeParse(value);
    if (!parsed.success) throw new OutputValidationError();
    const referenceSet = new Set(references.map((reference) => `${reference.type}:${reference.id}`));
    if (!parsed.data.evidenceRefs.every((item) => referenceSet.has(item)) ||
      !parsed.data.knowledgeRefs.every((item) => referenceSet.has(item)) ||
      (parsed.data.abstained && (parsed.data.evidenceRefs.length > 0 || parsed.data.knowledgeRefs.length > 0))) {
      throw new OutputValidationError();
    }
    return parsed.data;
  }

  private hash(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private timeoutMs(): number {
    const configured = Number(process.env.AI_TIMEOUT_MS ?? 10_000);
    return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 60_000) : 10_000;
  }
}

class OutputValidationError extends Error {}
