import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  createTestimonial,
  createTestimonialSchema,
  getTestimonialsByTenant,
} from '@/lib/testimonials';
import { parsePagination } from '@/lib/security/validation-schemas';
import { TestimonialStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const validatedData = createTestimonialSchema.parse(body);
    const testimonial = await createTestimonial(tenant.id as string, validatedData);

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);

    const { page, limit } = parsePagination(searchParams);

    const statusParam = searchParams.get('status');
    const ratingParam = searchParams.get('rating');
    const featuredParam = searchParams.get('isFeatured');

    const filters = {
      search: searchParams.get('search') || undefined,
      status: statusParam ? (statusParam as TestimonialStatus) : undefined,
      rating: ratingParam ? parseInt(ratingParam, 10) : undefined,
      isFeatured: featuredParam ? featuredParam === 'true' : undefined,
      page,
      limit,
    };

    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    );

    const result = await getTestimonialsByTenant(tenant.id as string, cleanFilters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
