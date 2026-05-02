import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'API endpoint /api/health доступен.',
    service: 'halktestapp',
    timestamp: new Date().toISOString()
  });
}
