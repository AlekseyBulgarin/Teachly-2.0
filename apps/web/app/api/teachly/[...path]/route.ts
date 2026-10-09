import { NextRequest, NextResponse } from 'next/server';
import { createDemoBoardBinding, verifyDemoBoardBinding } from '@/lib/demo-board-session';

// Whiteboard V1 is proxied exactly: create one board, then read and write that
// single board's state. Listing boards, board metadata, patch/archive, delete,
// and resource attachment are deliberately not proxied. State access also
// requires an integrity-protected HttpOnly binding created with that board, so
// learning another visitor's UUID is insufficient to read or write it.
const whiteboardCreateRoute = /^v1\/whiteboards$/;
const variantsRoute = /^v1\/assessment\/variants$/;
const aiStatusRoute = /^v1\/ai\/status$/;
const remediationRoute = /^v1\/remediations$/;
const knowledgeStatusRoute = /^v1\/knowledge\/status$/;
const whiteboardStateRoute =
  /^v1\/whiteboards\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/state$/i;
const demoBoardCookie = 'teachly-demo-board';
const upstreamTimeoutMs = 15_000;
const remediationUpstreamTimeoutMs = 30_000;

const allowedGetRoutes = [
  /^health$/,
  /^v1\/assessment\/tasks$/,
  variantsRoute,
  aiStatusRoute,
  knowledgeStatusRoute,
  /^v1\/integration$/,
  /^v1\/theory\/materials$/,
  /^v1\/trainer\/sessions\/[0-9a-f-]+$/i,
  /^v1\/trainer\/sessions\/[0-9a-f-]+\/current$/i,
  /^v1\/learner-intelligence\/profile$/,
  /^v1\/learner-intelligence\/progress$/,
  whiteboardStateRoute,
];

const allowedPostRoutes = [
  /^v1\/trainer\/sessions$/,
  /^v1\/trainer\/sessions\/[0-9a-f-]+\/(submissions|next|complete)$/i,
  whiteboardCreateRoute,
  remediationRoute,
];

const allowedPutRoutes = [whiteboardStateRoute];

function isAllowed(method: string, path: string): boolean {
  const routes = method === 'GET'
    ? allowedGetRoutes
    : method === 'POST'
      ? allowedPostRoutes
      : method === 'PUT'
        ? allowedPutRoutes
        : [];
  return routes.some((route) => route.test(path));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function publicTheoryBlock(value: unknown) {
  const block = asRecord(value);
  return {
    type: block.type,
    ...(typeof block.text === 'string' ? { text: block.text } : {}),
    ...(typeof block.latex === 'string' ? { latex: block.latex } : {}),
    ...(Array.isArray(block.items) && block.items.every((item) => typeof item === 'string')
      ? { items: block.items }
      : {}),
  };
}

function publicTheoryMaterial(value: unknown) {
  const material = asRecord(value);
  const version = asRecord(material.version);
  const content = asRecord(version.content);
  const curriculum = asRecord(material.curriculum);
  return {
    id: material.id,
    title: material.title,
    description: material.description,
    category: material.category,
    status: material.status,
    curriculum: {
      subjectId: curriculum.subjectId,
      courseId: curriculum.courseId,
      topicId: curriculum.topicId,
      skillId: curriculum.skillId,
    },
    taskIds: Array.isArray(material.taskIds) ? material.taskIds : [],
    version: {
      id: version.id,
      version: version.version,
      status: version.status,
      content: { blocks: Array.isArray(content.blocks) ? content.blocks.map(publicTheoryBlock) : [] },
    },
  };
}

function publicTrainerItem(value: unknown) {
  const item = asRecord(value);
  const result = asRecord(item.result);
  return {
    id: item.id,
    position: item.position,
    status: item.status,
    task: item.task,
    result: item.result ? {
      outcome: result.outcome,
      isCorrect: result.isCorrect,
      score: result.score,
    } : null,
  };
}

function publicTrainerSession(value: unknown) {
  const session = asRecord(value);
  const latestResult = asRecord(session.latestResult);
  return {
    id: session.id,
    status: session.status,
    progress: session.progress,
    current: session.current ? publicTrainerItem(session.current) : null,
    latestResult: session.latestResult ? {
      outcome: latestResult.outcome,
      isCorrect: latestResult.isCorrect,
      score: latestResult.score,
    } : null,
    canComplete: session.canComplete,
    idempotentReplay: session.idempotentReplay,
  };
}

function publicWhiteboardCreate(value: unknown) {
  const board = asRecord(value);
  return { id: board.id, currentRevision: board.currentRevision };
}

function publicVariant(value: unknown) {
  const variant = asRecord(value);
  return {
    id: variant.id,
    version: variant.version,
    status: variant.status,
    title: variant.title,
    description: variant.description,
    publishedAt: variant.publishedAt,
    items: Array.isArray(variant.items) ? variant.items.map((entry) => {
      const item = asRecord(entry);
      return {
        id: item.id,
        position: item.position,
        required: item.required,
        resolutionStatus: item.resolutionStatus,
        section: item.section,
      };
    }) : [],
  };
}

function publicKnowledgeStatus(value: unknown) {
  const item = asRecord(value);
  return {
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    sourceType: item.sourceType,
    sourceStatus: item.sourceStatus,
    sourceLicenseStatus: item.sourceLicenseStatus,
    documentId: item.documentId,
    documentTitle: item.documentTitle,
    documentStatus: item.documentStatus,
    versionId: item.versionId,
    version: item.version,
    versionStatus: item.versionStatus,
    licenseStatus: item.licenseStatus,
    externalAiPermission: item.externalAiPermission,
    approvedAt: item.approvedAt,
  };
}

function sanitizeResponse(path: string, value: unknown): unknown {
  if (whiteboardCreateRoute.test(path)) {
    return publicWhiteboardCreate(value);
  }
  if (path === 'v1/theory/materials') {
    return Array.isArray(value) ? value.map(publicTheoryMaterial) : [];
  }
  if (variantsRoute.test(path)) {
    return Array.isArray(value) ? value.map(publicVariant) : [];
  }
  if (knowledgeStatusRoute.test(path)) {
    return Array.isArray(value) ? value.map(publicKnowledgeStatus) : [];
  }
  if (/^v1\/trainer\/sessions\/[0-9a-f-]+\/submissions$/i.test(path)) {
    const response = asRecord(value);
    const submitted = asRecord(response.submitted);
    const submittedResult = asRecord(submitted.result);
    const teacherSignal = asRecord(response.teacherSignal);
    return {
      submitted: {
        result: {
          outcome: submittedResult.outcome,
          isCorrect: submittedResult.isCorrect,
          score: submittedResult.score,
          evaluationRule: submittedResult.evaluationRule,
        },
      },
      theory: Array.isArray(response.theory) ? response.theory.map(publicTheoryMaterial) : [],
      teacherSignal: response.teacherSignal ? {
        type: teacherSignal.type,
        evidenceCount: teacherSignal.evidenceCount,
        recentOutcomes: teacherSignal.recentOutcomes,
      } : null,
      session: publicTrainerSession(response.session),
    };
  }
  if (/^v1\/trainer\/sessions(?:\/[0-9a-f-]+(?:\/current|\/next|\/complete)?)?$/i.test(path)) {
    return publicTrainerSession(value);
  }
  return value;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const joinedPath = path.join('/');
  if (!isAllowed(request.method, joinedPath)) {
    return NextResponse.json({ code: 'DEMO_ROUTE_NOT_ALLOWED', message: 'This API route is not available through the Showcase proxy' }, { status: 403 });
  }
  const configuredApiBaseUrl = process.env.TEACHLY_API_URL
    ?? (process.env.NODE_ENV === 'production' ? null : 'http://127.0.0.1:3001');
  if (!configuredApiBaseUrl) {
    return NextResponse.json(
      { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
      { status: 503 },
    );
  }
  let baseUrlEnd = configuredApiBaseUrl.length;
  while (baseUrlEnd > 0 && configuredApiBaseUrl.charCodeAt(baseUrlEnd - 1) === 47) baseUrlEnd -= 1;
  const apiBaseUrl = configuredApiBaseUrl.slice(0, baseUrlEnd);
  // The learner identity is server-owned: the browser can never choose which
  // external learner to read. Any client-supplied value is discarded.
  const isLearnerIntelligence = joinedPath === 'v1/learner-intelligence/profile' || joinedPath === 'v1/learner-intelligence/progress';
  let target: string;
  if (isLearnerIntelligence) {
    const demoLearnerId = process.env.TEACHLY_DEMO_EXTERNAL_LEARNER_ID
      ?? (process.env.NODE_ENV === 'production' ? null : 'demo-learner-01');
    if (!demoLearnerId) {
      return NextResponse.json(
        { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
        { status: 503 },
      );
    }
    const searchParams = new URLSearchParams(request.nextUrl.search);
    searchParams.delete('externalUserId');
    searchParams.set('externalUserId', demoLearnerId);
    target = `${apiBaseUrl}/${joinedPath}?${searchParams.toString()}`;
  } else {
    target = `${apiBaseUrl}/${joinedPath}${request.nextUrl.search}`;
  }
  const headers = new Headers();
  headers.set('accept', 'application/json');
  if (request.method !== 'GET') headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  let demoApiKey: string | null = null;
  if (joinedPath.startsWith('v1/')) {
    demoApiKey = process.env.TEACHLY_DEMO_API_KEY
      ?? (process.env.NODE_ENV === 'production' ? null : 'tlk_00000000000000dd.teachly-demo-key');
    if (!demoApiKey) {
      return NextResponse.json(
        { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
        { status: 503 },
      );
    }
    headers.set('authorization', `Bearer ${demoApiKey}`);
  }
  const whiteboardStateMatch = whiteboardStateRoute.exec(joinedPath);
  if (whiteboardStateMatch) {
    const boardId = whiteboardStateMatch[1];
    const sessionSecret = process.env.TEACHLY_DEMO_SESSION_SECRET ?? demoApiKey;
    if (!boardId || !sessionSecret || !verifyDemoBoardBinding(request.cookies.get(demoBoardCookie)?.value, boardId, sessionSecret)) {
      return NextResponse.json(
        { code: 'WHITEBOARD_NOT_FOUND', message: 'Whiteboard not found' },
        { status: 404 },
      );
    }
  }
  const requestId = request.headers.get('x-request-id');
  if (requestId) headers.set('x-request-id', requestId);
  try {
    let body: string | undefined;
    if (request.method !== 'GET') {
      body = await request.text();
      if (joinedPath === 'v1/trainer/sessions') {
        let input: Record<string, unknown>;
        try {
          input = body ? JSON.parse(body) as Record<string, unknown> : {};
        } catch {
          return NextResponse.json({ code: 'INVALID_JSON', message: 'Request body must be valid JSON' }, { status: 400 });
        }
        const demoLearnerId = process.env.TEACHLY_DEMO_EXTERNAL_LEARNER_ID
          ?? (process.env.NODE_ENV === 'production' ? null : 'demo-learner-01');
        if (!demoLearnerId) {
          return NextResponse.json(
            { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
            { status: 503 },
          );
        }
        const configuredTaskIds = process.env.TEACHLY_DEMO_TASK_IDS?.split(',').map((value) => value.trim()).filter(Boolean);
        const taskIds = configuredTaskIds?.length
          ? configuredTaskIds
          : process.env.NODE_ENV === 'production'
            ? null
            : ['00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000026'];
        if (!taskIds) {
          return NextResponse.json(
            { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
            { status: 503 },
          );
        }
        body = JSON.stringify({
          idempotencyKey: input.idempotencyKey,
          externalLearnerId: demoLearnerId,
          taskIds,
        });
      }
      if (remediationRoute.test(joinedPath)) {
        let input: Record<string, unknown>;
        try {
          input = body ? JSON.parse(body) as Record<string, unknown> : {};
        } catch {
          return NextResponse.json({ code: 'INVALID_JSON', message: 'Request body must be valid JSON' }, { status: 400 });
        }
        const externalUserId = process.env.TEACHLY_DEMO_EXTERNAL_LEARNER_ID
          ?? (process.env.NODE_ENV === 'production' ? null : 'demo-learner-01');
        const attemptId = process.env.TEACHLY_DEMO_ATTEMPT_ID
          ?? (process.env.NODE_ENV === 'production' ? null : '00000000-0000-4000-8000-000000000014');
        if (!externalUserId || !attemptId) {
          return NextResponse.json(
            { code: 'DEMO_NOT_CONFIGURED', message: 'The live Teachly demo is not configured' },
            { status: 503 },
          );
        }
        body = JSON.stringify({
          externalUserId,
          attemptId,
          learnerQuestion: typeof input.learnerQuestion === 'string' ? input.learnerQuestion.slice(0, 1_000) : undefined,
          idempotencyKey: typeof input.idempotencyKey === 'string' ? input.idempotencyKey.slice(0, 255) : undefined,
        });
      }
    }
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(remediationRoute.test(joinedPath) ? remediationUpstreamTimeoutMs : upstreamTimeoutMs),
    });
    if (!response.ok) {
      return NextResponse.json(
        { code: 'TEACHLY_API_ERROR', message: 'The live Teachly demo request could not be completed' },
        { status: response.status },
      );
    }
    if (whiteboardCreateRoute.test(joinedPath)) {
      const sanitized = publicWhiteboardCreate(await response.json());
      if (typeof sanitized.id !== 'string' || !demoApiKey) {
        return NextResponse.json({ code: 'INVALID_BACKEND_RESPONSE', message: 'Teachly API returned an invalid response' }, { status: 502 });
      }
      const result = NextResponse.json(sanitized, { status: response.status });
      result.cookies.set(demoBoardCookie, createDemoBoardBinding(sanitized.id, process.env.TEACHLY_DEMO_SESSION_SECRET ?? demoApiKey), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/teachly/v1/whiteboards',
        maxAge: 60 * 60 * 24 * 7,
      });
      return result;
    }
    if (joinedPath === 'v1/theory/materials' || variantsRoute.test(joinedPath) || knowledgeStatusRoute.test(joinedPath) || joinedPath.startsWith('v1/trainer/sessions')) {
      return NextResponse.json(sanitizeResponse(joinedPath, await response.json()), { status: response.status });
    }
    return new NextResponse(response.body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json({ code: 'BACKEND_TIMEOUT', message: 'Teachly API did not respond in time' }, { status: 504 });
    }
    return NextResponse.json({ code: 'BACKEND_UNAVAILABLE', message: 'Teachly API is unavailable' }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
