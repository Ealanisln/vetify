import { NextResponse } from 'next/server';
import { hasSuperAdmins } from '../../../../lib/setup/setup-validator';

// GET /api/setup/verify
export async function GET() {
  const isSetupNeeded = !(await hasSuperAdmins());
  return NextResponse.json({ isSetupNeeded });
} 