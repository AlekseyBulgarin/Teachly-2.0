import request, { type Response } from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { fixtureIds } from '../../src/infrastructure/database/seed';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service';
import type { IntegrationScope } from '../../src/modules/integrations/integrations.types';
import { TenancyService } from '../../src/modules/tenancy/tenancy.service';
import type { KompegeLikeTask } from './kompege-like.tasks';
import { kompegeCurriculum } from './kompege-like.tasks';

export type AssessmentAuth = Record<string, string>;

export const assessmentTaskBankScopes: IntegrationScope[] = [
  'assessment:read', 'assessment:answer:read', 'assessment:write', 'assessment:manage',
];

export const variantAssessmentScopes: IntegrationScope[] = ['assessment:read', 'assessment:write', 'assessment:manage'];

export const kompegeFixtureScopes: IntegrationScope[] = [
  'external_users:read', 'external_users:write', ...assessmentTaskBankScopes,
];

export interface AssessmentTenantOptions {
  workspaceName?: string;
  integrationName?: string;
  keyName?: string;
  scopes?: IntegrationScope[];
}

export async function createAssessmentTenant(app: INestApplication, organizationName: string, options: AssessmentTenantOptions = {}) {
  const tenancy = app.get(TenancyService);
  const integrations = app.get(IntegrationsService);
  const organization = await tenancy.createOrganization(organizationName);
  const workspace = await tenancy.createWorkspace(organization.id, options.workspaceName ?? 'Assessment workspace');
  const integration = await integrations.createIntegration(organization.id, workspace.id, options.integrationName ?? 'Task source integration');
  const key = await integrations.createApiKey({
    organizationId: organization.id,
    workspaceId: workspace.id,
    integrationId: integration.id,
    name: options.keyName ?? 'Assessment key',
    scopes: [...(options.scopes ?? assessmentTaskBankScopes)],
  });
  return { organization, workspace, integration, key, auth: { Authorization: `Bearer ${key.secret}` } as AssessmentAuth };
}

export async function createFixtureWorkspaceApiKey(app: INestApplication, options: { integrationName: string; keyName: string; scopes: IntegrationScope[] }) {
  const integrations = app.get(IntegrationsService);
  const integration = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, options.integrationName);
  const key = await integrations.createApiKey({
    organizationId: fixtureIds.organization,
    workspaceId: fixtureIds.workspace,
    integrationId: integration.id,
    name: options.keyName,
    scopes: [...options.scopes],
  });
  return { integration, key, auth: { Authorization: `Bearer ${key.secret}` } as AssessmentAuth };
}

export function buildGenericRawTask(taskType = 'single-choice', statement = 'Choose one') {
  return {
    title: 'Imported task',
    statement,
    taskType,
    blocks: [
      { type: 'paragraph', text: statement },
      { type: 'formula', latex: 'x^2' },
      { type: 'table', rows: [['A', 'B']] },
    ],
    options: taskType === 'single-choice' ? [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] : undefined,
    answer: taskType === 'single-choice' ? 'a' : undefined,
    metadata: { year: 2026, category: 'generic' },
  };
}

export function buildKompegeCurriculumMappings(workspaceId: string, taskSourceId: string) {
  const { subject, course, expressionsTopic, proofTopic, compareValuesSkill, applyFormulasSkill } = kompegeCurriculum;
  const { subject: subjectId, course: courseId, topic: topicId, skill: skillId } = fixtureIds;
  return [
    { workspaceId, taskSourceId, mappingType: 'subject', externalValue: subject, subjectId },
    { workspaceId, taskSourceId, mappingType: 'course', externalValue: course, subjectId, courseId },
    { workspaceId, taskSourceId, mappingType: 'topic', externalValue: expressionsTopic, subjectId, courseId, topicId },
    { workspaceId, taskSourceId, mappingType: 'topic', externalValue: proofTopic, subjectId, courseId, topicId },
    { workspaceId, taskSourceId, mappingType: 'skill', externalValue: compareValuesSkill, subjectId, courseId, topicId, skillId },
    { workspaceId, taskSourceId, mappingType: 'skill', externalValue: applyFormulasSkill, subjectId, courseId, topicId, skillId },
  ];
}

export function createTaskSource(
  app: INestApplication,
  auth: AssessmentAuth,
  name: string,
  sourceType = 'local-json',
  mode: 'imported_snapshot' | 'external_reference' = 'imported_snapshot',
) {
  return request(app.getHttpServer()).post('/v1/assessment/task-sources').set(auth)
    .send({ name, sourceType, mode }).expect(201);
}

export function importTask(
  app: INestApplication,
  auth: AssessmentAuth,
  sourceId: string,
  input: { externalTaskId: string; idempotencyKey: string; rawPayload: Record<string, unknown> },
) {
  return request(app.getHttpServer()).post(`/v1/assessment/task-sources/${sourceId}/import`).set(auth)
    .send(input).expect(201);
}

export async function importAndPublishTask(
  app: INestApplication,
  auth: AssessmentAuth,
  sourceId: string,
  task: KompegeLikeTask,
  idempotencyKey: string,
): Promise<Response> {
  const imported = await importTask(app, auth, sourceId, {
    externalTaskId: task.externalTaskId, idempotencyKey, rawPayload: task,
  });
  return request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${imported.body.id}/publish`).set(auth).expect(201);
}
