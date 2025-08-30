import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assertSetupAllowed } from '../../../../lib/setup/setup-validator';
import { validateSetupToken, consumeSetupToken } from '../../../../lib/setup/setup-token';
import { initializeFirstSuperAdmin } from '../../../../lib/super-admin';
import { logAdminAction } from '../../../../lib/db/queries/admin-audit';
import { AdminAction } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';

const bodySchema = z.object({
  token: z.string().length(32),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = bodySchema.parse(body);

    // Ensure setup still allowed (no super admins yet)
    await assertSetupAllowed();

    const validation = await validateSetupToken(token);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const tokenRecord = validation.token;

    // Assign first super admin and get user id
    const user = await prisma.user.findUnique({ where: { email: tokenRecord.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found for token email.' }, { status: 400 });
    }

    const result = await initializeFirstSuperAdmin(tokenRecord.email);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Mark token as consumed (performed by the user who just became admin)
    await consumeSetupToken(token, user.id);

    // Audit log
    await logAdminAction({
      action: AdminAction.SETUP_COMPLETED,
      performedByUserId: null,
      targetUserId: user.id,
      targetEmail: user.email,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Setup completion error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 