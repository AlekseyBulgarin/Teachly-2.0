import { NextRequest, NextResponse } from 'next/server';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${process.env.TEACHLY_API_URL ?? 'http://localhost:3000'}/${path.join('/')}`;
  const headers = new Headers();
  headers.set('accept', 'application/json');
  if (request.method !== 'GET') headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  if (path[0] === 'v1') {
    headers.set('authorization', `Bearer ${process.env.TEACHLY_DEMO_API_KEY ?? 'tlk_00000000000000dd.teachly-demo-key'}`);
  } else {
    headers.set('x-dev-user', 'teacher');
  }
  const requestId = request.headers.get('x-request-id');
  if (requestId) headers.set('x-request-id', requestId);
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ code: 'BACKEND_UNAVAILABLE', message: 'Teachly API is unavailable' }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
