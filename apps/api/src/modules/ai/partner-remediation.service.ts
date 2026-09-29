import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainError } from '../../common/errors';
import { AuditService } from '../audit/audit.service';
import { ExternalUsersService } from '../external-users/external-users.service';
import type { TenantContext } from '../core/core.types';
import { AiRuntime, AiRuntimeError } from './ai-runtime.service';
import type { AiExecutionResult } from './ai.types';
import type { PartnerRemediationRequestDto } from './partner-remediation.dto';

@Injectable()
export class PartnerRemediationService {
  constructor(
    private readonly externalUsers: ExternalUsersService,
    private readonly runtime: AiRuntime,
    private readonly audit: AuditService,
  ) {}

  async execute(
    context: TenantContext,
    input: PartnerRemediationRequestDto,
    correlationId: string,
  ): Promise<AiExecutionResult> {
    const externalUser = await this.externalUsers.resolveActiveLearner(context, input.externalUserId);
    try {
      const result = await this.runtime.execute({
        context,
        learnerId: externalUser.learnerId,
        attemptId: input.attemptId,
        capability: 'grounded_remediation',
        learnerRequest: input.learnerQuestion?.trim() || 'Explain this incorrect attempt and provide a grounded hint.',
        idempotencyKey: `${context.integrationId}:${input.idempotencyKey}`,
      });
      await this.audit.record(null, 'partner_remediation_succeeded', 'ai_request', result.requestId, {
        correlationId,
        integrationId: context.integrationId,
        apiKeyId: context.principal.apiKeyId,
        externalUserMappingId: externalUser.id,
        attemptId: input.attemptId,
        knowledgeRefs: result.output.knowledgeRefs,
        replayed: result.replayed,
      }, context.workspaceId);
      return result;
    } catch (error) {
      const mapped = this.mapError(error);
      const aiRequestId = error instanceof AiRuntimeError ? error.requestId : undefined;
      await this.audit.record(null, 'partner_remediation_failed', aiRequestId ? 'ai_request' : 'external_user', aiRequestId ?? externalUser.id, {
        correlationId,
        integrationId: context.integrationId,
        apiKeyId: context.principal.apiKeyId,
        externalUserMappingId: externalUser.id,
        attemptId: input.attemptId,
        errorCode: mapped.code,
      }, context.workspaceId);
      throw mapped;
    }
  }

  private mapError(error: unknown): DomainError {
    if (error instanceof NotFoundException) {
      return new DomainError('ATTEMPT_NOT_ACCESSIBLE', 'Attempt is not accessible for this learner', 404);
    }
    if (error instanceof AiRuntimeError) {
      if (error.category === 'idempotency_conflict') {
        return new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for a different request', 409);
      }
      if (error.category === 'in_progress') {
        return new DomainError('REMEDIATION_IN_PROGRESS', 'Remediation request is already in progress', 409);
      }
      return new DomainError('REMEDIATION_UNAVAILABLE', 'Grounded remediation is temporarily unavailable', 503);
    }
    return new DomainError('REMEDIATION_UNAVAILABLE', 'Grounded remediation is temporarily unavailable', 503);
  }
}
