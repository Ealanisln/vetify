import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getMedicalHistoryById } from '@/lib/medical-history';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });
    
    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const history = await getMedicalHistoryById(userWithTenant.tenant.id, params.id);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error en GET /api/medical-history/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 