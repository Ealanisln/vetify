import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import {
  MedicalHistoryInputError,
  createMedicalHistory,
  getRecentMedicalHistories,
  getMedicalHistoryStats,
  getPetMedicalHistory,
  searchMedicalHistories
} from '../../../lib/medical-history';
import { prisma } from '../../../lib/prisma';
import { getTenantTimeZone, parseClinicDateTimeInput } from '../../../lib/clinical-dates';
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
    if (!historyData.petId || !historyData.reasonForVisit) {
      return NextResponse.json(
        { error: 'Mascota y motivo de consulta son requeridos' },
        { status: 400 }
      );
    }

    const tenantId = userWithTenant.tenant.id;

    // The form sends a datetime-local value (a clinic wall-clock time) or
    // nothing, which means the visit is happening now
    let visitDate = new Date();
    if (historyData.visitDate) {
      const timeZone = await getTenantTimeZone(tenantId);
      const parsed = parseClinicDateTimeInput(String(historyData.visitDate), timeZone);
      if (!parsed) {
        return NextResponse.json({ error: 'La fecha de visita no es válida' }, { status: 400 });
      }
      visitDate = parsed;
    }

    // MedicalHistory.staffId references Staff, not the Kinde user
    const staff = await prisma.staff.findFirst({
      where: { userId: user.id, tenantId, isActive: true },
      select: { id: true }
    });

    // Crear la entrada de historia clínica
    const history = await createMedicalHistory(tenantId, staff?.id ?? null, {
      ...historyData,
      visitDate: visitDate.toISOString()
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    if (error instanceof MedicalHistoryInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error en POST /api/medical-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 