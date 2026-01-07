import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getTestimonialStats } from '@/lib/testimonials';

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const stats = await getTestimonialStats(tenant.id as string);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching testimonial stats:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
