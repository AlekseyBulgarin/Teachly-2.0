import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AttemptsService } from '../attempts/attempts.service';
import { EducationService } from '../education/education.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { LearningService } from '../learning/learning.service';
import { KNOWLEDGE_RETRIEVAL_PORT, type KnowledgeRetrievalPort } from '../knowledge/knowledge.types';
import type { TenantContext } from '../integrations/integrations.types';
import type { AiCapability, AiContext, AiContextReference } from './ai.types';

@Injectable()
export class AiContextAssembler {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly attempts: AttemptsService,
    private readonly education: EducationService,
    private readonly learning: LearningService,
    @Inject(KNOWLEDGE_RETRIEVAL_PORT) private readonly knowledge: KnowledgeRetrievalPort,
  ) {}

  async assemble(input: {
    context: TenantContext;
    learnerId: string;
    attemptId: string;
    capability: AiCapability;
    learnerRequest: string;
  }): Promise<AiContext> {
    await this.integrations.requireActiveTenantContext(input.context);
    if (!input.learnerRequest.trim()) throw new ForbiddenException('A learner request is required');
    const attemptResult = await this.attempts.getResult(input.learnerId, input.attemptId, input.context);
    const task = await this.education.getPublishedTaskVersion(attemptResult.attempt.taskVersionId, input.context);
    if (task.workspaceId !== input.context.workspaceId) throw new ForbiddenException('Task is outside the workspace');
    const learningState = await this.learning.getLearningState(input.learnerId, task.task.skillId, input.context);
    const excerpts = await this.knowledge.retrieveForExternalAi({ context: input.context, limit: 8 });
    const contextReferences: AiContextReference[] = [
      { type: 'task_version', id: task.taskVersion.id },
      { type: 'attempt', id: attemptResult.attempt.id },
      { type: 'result', id: attemptResult.result.id },
      ...learningState.explanation.evidenceReferences.map((id) => ({ type: 'skill_evidence', id })),
      ...excerpts.map((excerpt) => ({ type: 'knowledge_chunk', id: excerpt.chunkId })),
    ];
    return {
      capability: input.capability,
      learnerRequest: input.learnerRequest.trim(),
      task: {
        taskVersionId: task.taskVersion.id,
        version: task.taskVersion.version,
        taskType: task.taskVersion.taskType,
        statement: task.taskVersion.content.statement,
        options: task.taskVersion.content.options,
        evaluationRule: task.taskVersion.evaluationRule,
        subject: task.subject.name,
        course: task.course.name,
        topic: task.topic.name,
        skill: task.skill.name,
      },
      attempt: attemptResult.attempt,
      result: attemptResult.result,
      learningState: {
        status: learningState.status,
        evidenceCount: learningState.evidenceCount,
        recentOutcomes: learningState.recentOutcomes,
        explanation: learningState.explanation,
      },
      knowledge: excerpts.map((excerpt) => ({
        chunkId: excerpt.chunkId,
        documentVersionId: excerpt.documentVersionId,
        content: excerpt.content,
        section: excerpt.section,
        sourceName: excerpt.source.name,
      })),
      contextReferences,
    };
  }
}
