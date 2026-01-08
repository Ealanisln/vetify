import { NextResponse } from 'next/server';
import { getVersionInfo } from '@/lib/version';

/**
 * Version endpoint - returns application version information
 * This is a public endpoint for monitoring, CI/CD, and client version checks
 */
export async function GET() {
  const versionInfo = getVersionInfo();

  return NextResponse.json(versionInfo, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  });
}
