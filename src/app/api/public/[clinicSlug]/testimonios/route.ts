import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import {
  getApprovedTestimonials,
  getPublicTestimonialStats,
  submitPublicTestimonial,
  publicTestimonialSchema,
} from '@/lib/testimonials';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ clinicSlug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { clinicSlug } = await context.params;
    const { searchParams } = new URL(request.url);

    const tenant = await getTenantBySlug(clinicSlug);

    if (!tenant || !tenant.publicPageEnabled) {
      return NextResponse.json(
        { error: 'Clinic not found or public page disabled' },
        { status: 404 }
      );
    }

    const featuredOnly = searchParams.get('featured') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const [testimonials, stats] = await Promise.all([
      getApprovedTestimonials(tenant.id, { featuredOnly, limit }),
      getPublicTestimonialStats(tenant.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        testimonials,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching public testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { clinicSlug } = await context.params;
    const body = await request.json();

    const tenant = await getTenantBySlug(clinicSlug);

    if (!tenant || !tenant.publicPageEnabled) {
      return NextResponse.json(
        { error: 'Clinic not found or public page disabled' },
        { status: 404 }
      );
    }

    // Honeypot check - if website field is filled, it's a bot
    if (body.website && body.website.length > 0) {
      // Silently accept to not alert bots
      return NextResponse.json({
        success: true,
        message: 'Gracias por tu testimonio. Lo revisaremos pronto.',
      });
    }

    const validatedData = publicTestimonialSchema.parse(body);

    await submitPublicTestimonial(tenant.id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Gracias por tu testimonio. Lo revisaremos pronto.',
    });
  } catch (error) {
    console.error('Error submitting testimonial:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al enviar el testimonio' },
      { status: 500 }
    );
  }
}
