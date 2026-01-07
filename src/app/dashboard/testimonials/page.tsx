import { notFound } from 'next/navigation';
import { requireActiveSubscription } from '@/lib/auth';
import { getTestimonialsByTenant, getTestimonialStats } from '@/lib/testimonials';
import TestimonialsList from '@/components/testimonials/TestimonialsList';
import { TestimonialStatus } from '@prisma/client';

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
  rating?: string;
}

interface TestimonialsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function TestimonialsPage({ searchParams }: TestimonialsPageProps) {
  const { user, tenant } = await requireActiveSubscription();

  if (!user || !tenant) {
    notFound();
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 20;
  const search = params.search?.trim();
  const status = params.status as TestimonialStatus | undefined;
  const rating = params.rating ? parseInt(params.rating, 10) : undefined;

  try {
    const [result, stats] = await Promise.all([
      getTestimonialsByTenant(tenant.id, {
        page,
        limit,
        search,
        status,
        rating,
      }),
      getTestimonialStats(tenant.id),
    ]);

    return (
      <div className="container mx-auto px-4 py-6">
        <TestimonialsList
          initialTestimonials={result.testimonials}
          pagination={result.pagination}
          stats={stats}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading testimonials page:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">
            No se pudo cargar la información de testimonios. Por favor, intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }
}

export const metadata = {
  title: 'Testimonios - Vetify',
  description: 'Administra los testimonios de clientes de tu veterinaria',
};
