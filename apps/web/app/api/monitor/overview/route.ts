import { NextRequest, NextResponse } from 'next/server';
import { monitorRequestAuthorized } from '@/lib/monitor-auth';

const ranges = new Set(['15m', '1h', '6h', '24h', '7d']);

export async function GET(request: NextRequest) {
  if (!monitorRequestAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Teachly Monitor authentication required' }, { status: 401 });
  }
  const configuredApiUrl = process.env.TEACHLY_API_URL?.trim();
  const token = process.env.METRICS_TOKEN?.trim();
  if (!configuredApiUrl || !token) {
    return NextResponse.json({ code: 'MONITOR_NOT_CONFIGURED', message: 'Teachly Monitor server connection is not configured' }, { status: 503 });
  }
  const requestedRange = request.nextUrl.searchParams.get('range') ?? '1h';
  if (!ranges.has(requestedRange)) {
    return NextResponse.json({ code: 'INVALID_RANGE', message: 'Unsupported monitoring range' }, { status: 400 });
  }
  let baseUrlEnd = configuredApiUrl.length;
  while (baseUrlEnd > 0 && configuredApiUrl.charCodeAt(baseUrlEnd - 1) === 47) baseUrlEnd -= 1;
  try {
    const response = await fetch(`${configuredApiUrl.slice(0, baseUrlEnd)}/internal/monitoring/overview?range=${requestedRange}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > 2_000_000) throw new Error('Monitoring response is too large');
    const body = await response.text();
    if (body.length > 2_000_000) throw new Error('Monitoring response is too large');
    return new NextResponse(body, {
      status: response.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ code: 'MONITOR_UNAVAILABLE', message: 'Teachly Monitor data source is unavailable' }, { status: 503 });
  }
}
