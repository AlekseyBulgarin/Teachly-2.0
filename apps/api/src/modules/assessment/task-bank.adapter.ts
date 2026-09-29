import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { ExternalCurriculumReferences, GenericTaskPayload, NormalizedAnswerSchema, NormalizedTaskContent } from './task-bank.types';

export type NormalizedImportedTask = {
  taskType: string;
  content: NormalizedTaskContent;
  answerSchema: NormalizedAnswerSchema;
  curriculum: ExternalCurriculumReferences;
};

export interface TaskSourceAdapter {
  normalizeTask(rawPayload: Record<string, unknown>): NormalizedImportedTask;
  checksum(rawPayload: Record<string, unknown>): string;
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

@Injectable()
export class GenericJsonTaskSourceAdapter implements TaskSourceAdapter {
  normalizeTask(rawPayload: Record<string, unknown>): NormalizedImportedTask {
    const raw = rawPayload as GenericTaskPayload;
    const sourceContent = raw.content && typeof raw.content === 'object' && !Array.isArray(raw.content)
      ? raw.content as Record<string, unknown> : rawPayload;
    const statement = textValue(raw.statement) ?? textValue(sourceContent.statement) ?? textValue(sourceContent.text);
    if (!statement) throw new BadRequestException('rawPayload.statement is required');
    const taskType = textValue(raw.taskType) ?? textValue(sourceContent.taskType) ?? 'unknown';
    const options = Array.isArray(raw.options) ? raw.options : Array.isArray(sourceContent.options) ? sourceContent.options : undefined;
    const normalizedOptions = options?.filter((option): option is { id: string; label: string } =>
      !!option && typeof option === 'object' && typeof (option as { id?: unknown }).id === 'string' && typeof (option as { label?: unknown }).label === 'string');
    const correctOptionId = textValue(raw.answer) ?? textValue(sourceContent.correctOptionId);
    const automatic = taskType === 'single-choice' && !!correctOptionId && !!normalizedOptions?.length;
    const content: NormalizedTaskContent = {
      title: textValue(raw.title) ?? textValue(sourceContent.title),
      statement,
      blocks: Array.isArray(raw.blocks) ? raw.blocks as NormalizedTaskContent['blocks'] : Array.isArray(sourceContent.blocks) ? sourceContent.blocks as NormalizedTaskContent['blocks'] : undefined,
      options: normalizedOptions,
      attachments: Array.isArray(raw.attachments) ? raw.attachments as NormalizedTaskContent['attachments'] : undefined,
      metadata: raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata) ? raw.metadata as NormalizedTaskContent['metadata'] : undefined,
      ...(automatic ? { correctOptionId } : {}),
    };
    return {
      taskType,
      content,
      answerSchema: { type: taskType, required: true, evaluatorCapability: automatic ? 'automatic' : 'unsupported' },
      curriculum: {
        subject: textValue(raw.subject) ?? textValue(raw.subjectId),
        course: textValue(raw.course) ?? textValue(raw.courseId),
        topic: textValue(raw.topic) ?? textValue(raw.topicId),
        skill: textValue(raw.skill) ?? textValue(raw.skillId),
        category: textValue(raw.category),
        section: textValue(raw.section),
      },
    };
  }

  checksum(rawPayload: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(rawPayload, Object.keys(rawPayload).sort())).digest('hex');
  }
}
