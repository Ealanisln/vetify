import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getTestimonialById,
  updateTestimonial,
  updateTestimonialSchema,
  deleteTestimonial,
  moderateTestimonial,
  moderateTestimonialSchema,
} from '@/lib/testimonials';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await context.params;

    const testimonial = await getTestimonialById(tenant.id as string, id);

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Error fetching testimonial:', error);

    if (error instanceof Error && error.message === 'Testimonio no encontrado') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { user, tenant } = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    // Check if this is a moderation action
    if (body.action && (body.action === 'approve' || body.action === 'reject')) {
      const validatedData = moderateTestimonialSchema.parse(body);

      // Get staff member for audit - find the staff linked to the authenticated user
      const staff = await prisma.staff.findFirst({
        where: {
          tenantId: tenant.id as string,
          userId: user.id,
        },
        select: { id: true },
      });

      if (!staff) {
        return NextResponse.json(
          { message: 'No se encontró personal para moderar' },
          { status: 400 }
        );
      }

      const testimonial = await moderateTestimonial(
        tenant.id as string,
        id,
        staff.id,
        validatedData
      );

      return NextResponse.json(testimonial);
    }

    // Regular update
    const validatedData = updateTestimonialSchema.parse(body);
    const testimonial = await updateTestimonial(tenant.id as string, id, validatedData);

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);

    if (error instanceof Error) {
      if (error.message === 'Testimonio no encontrado') {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await context.params;

    await deleteTestimonial(tenant.id as string, id);

    return NextResponse.json({ success: true, message: 'Testimonio eliminado' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);

    if (error instanceof Error && error.message === 'Testimonio no encontrado') {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
