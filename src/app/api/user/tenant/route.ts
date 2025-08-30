import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getTenantByUserId } from '../../../../lib/tenant';

export async function GET() {
  try {
    // Verificar autenticación
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Obtener tenant del usuario
    const tenant = await getTenantByUserId(kindeUser.id);

    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error fetching user tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 