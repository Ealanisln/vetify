import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import {
  createMedicalHistory,
  getRecentMedicalHistories,
  getMedicalHistoryStats,
  getPetMedicalHistory,
  searchMedicalHistories
} from '../../../lib/medical-history';
import { prisma } from '../../../lib/prisma';
import { MedicalHistoryFormData } from '@/types';
import { parsePagination } from '../../../lib/security/validation-schemas';

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const petId = searchParams.get('petId');
    const query = searchParams.get('q');

    // Obtener estadísticas de historias médicas
    if (action === 'stats') {
      const stats = await getMedicalHistoryStats(userWithTenant.tenant.id);
      return NextResponse.json(stats);
    }

    // SECURITY FIX: Use validated pagination with enforced limits
    const { page, limit } = parsePagination(searchParams);

    // Obtener historia clínica de una mascota específica
    if (petId) {
      const result = await getPetMedicalHistory(
        userWithTenant.tenant.id,
        petId,
        page,
        limit
      );
      return NextResponse.json(result);
    }

    // Buscar en historias médicas
    if (query) {
      const result = await searchMedicalHistories(
        userWithTenant.tenant.id,
        query,
        undefined,
        page,
        limit
      );
      return NextResponse.json(result);
    }
    const histories = await getRecentMedicalHistories(userWithTenant.tenant.id, limit);

    return NextResponse.json(histories);
  } catch (error) {
    console.error('Error en GET /api/medical-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const historyData: MedicalHistoryFormData = await request.json();

    // Validaciones básicas
    if (!historyData.petId || !historyData.visitDate || !historyData.reasonForVisit) {
      return NextResponse.json(
        { error: 'Mascota, fecha de visita y motivo de consulta son requeridos' },
        { status: 400 }
      );
    }

    // Por ahora, usamos el usuario como staff
    // En una implementación completa, necesitarías un sistema de staff separado
    const staffId = user.id;

    // Crear la entrada de historia clínica
    const history = await createMedicalHistory(
      userWithTenant.tenant.id,
      staffId,
      historyData
    );

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/medical-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 