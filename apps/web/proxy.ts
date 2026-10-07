import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { monitorRequestAuthorized } from '@/lib/monitor-auth';

export function proxy(request: NextRequest) {
  if (monitorRequestAuthorized(request.headers.get('authorization'))) return NextResponse.next();
  return new NextResponse('Teachly Monitor authentication required', {
    status: 401,
    headers: {
      'cache-control': 'no-store',
      'www-authenticate': 'Basic realm="Teachly Monitor", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ['/monitor/:path*', '/api/monitor/:path*'],
};
