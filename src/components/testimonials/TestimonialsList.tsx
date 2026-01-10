'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  TrashIcon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { TestimonialStatus } from '@prisma/client';
import TestimonialModal from './TestimonialModal';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

interface Customer {
  id: string;
  name: string;
  email?: string;
}

interface Appointment {
  id: string;
  dateTime: Date;
  reason: string;
}

interface Moderator {
  id: string;
  name: string;
}

interface Testimonial {
  id: string;
  reviewerName: string;
  reviewerEmail?: string | null;
  rating: number;
  text: string;
  status: TestimonialStatus;
  isFeatured: boolean;
  displayOrder?: number | null;
  source: string;
  submittedAt: Date;
  moderatedAt?: Date | null;
  moderationNote?: string | null;
  createdAt: Date;
  customer?: Customer | null;
  appointment?: Appointment | null;
  moderatedBy?: Moderator | null;
}

interface TestimonialsListProps {
  initialTestimonials: Testimonial[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
    total: number;
    averageRating: number;
    approvedCount: number;
  };
}

const statusConfig: Record<TestimonialStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
  ARCHIVED: { label: 'Archivado', variant: 'secondary' },
};

export default function TestimonialsList({
  initialTestimonials,
  pagination: initialPagination,
  stats: initialStats,
}: TestimonialsListProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestimonialStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const { canAccess, isLoading: permissionsLoading } = useStaffPermissions();

  // Check if user can manage testimonials (create, moderate, delete)
  const canManageTestimonials = canAccess('testimonials', 'write');

  const fetchTestimonials = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter.toString());
      }

      const response = await fetch(`/api/testimonials?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTestimonials(data.testimonials);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Error al cargar testimonios');
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, ratingFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/testimonials/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(action === 'approve' ? 'Testimonio aprobado' : 'Testimonio rechazado');
        fetchTestimonials(pagination.page);
        fetchStats();
      } else {
        toast.error(data.message || 'Error al moderar testimonio');
      }
    } catch (error) {
      console.error('Error moderating testimonial:', error);
      toast.error('Error de conexión');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(currentFeatured ? 'Quitado de destacados' : 'Marcado como destacado');
        fetchTestimonials(pagination.page);
      } else {
        toast.error(data.message || 'Error al actualizar testimonio');
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este testimonio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Testimonio eliminado');
        fetchTestimonials(pagination.page);
        fetchStats();
      } else {
        toast.error(data.message || 'Error al eliminar testimonio');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Error de conexión');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTestimonials(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, ratingFilter, fetchTestimonials]);

  const openModal = (mode: 'create' | 'edit' | 'view', testimonial?: Testimonial) => {
    setModalMode(mode);
    setSelectedTestimonial(testimonial || null);
    setIsModalOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Read-only alert for users without write permission */}
      {!permissionsLoading && !canManageTestimonials && (
        <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 rounded-lg">
          <LockClosedIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Modo de solo lectura</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Tu rol actual no tiene permisos para gestionar testimonios. Solo puedes ver la información.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Testimonios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona los testimonios de tus clientes
          </p>
        </div>
        <Button
          onClick={() => openModal('create')}
          className="bg-[#75a99c] hover:bg-[#5b9788]"
          disabled={!canManageTestimonials}
          title={!canManageTestimonials ? 'No tienes permisos para crear testimonios' : undefined}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Testimonio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aprobados</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rechazados</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.averageRating.toFixed(1)}
              </span>
              <StarIconSolid className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o contenido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#75a99c] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TestimonialStatus | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobados</option>
              <option value="REJECTED">Rechazados</option>
              <option value="ARCHIVED">Archivados</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todas las calificaciones</option>
              <option value="5">5 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="2">2 estrellas</option>
              <option value="1">1 estrella</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials List */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">
            {pagination.total} testimonio{pagination.total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <StarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron testimonios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {testimonial.reviewerName}
                        </span>
                        {renderStars(testimonial.rating)}
                        <Badge variant={statusConfig[testimonial.status].variant}>
                          {statusConfig[testimonial.status].label}
                        </Badge>
                        {testimonial.isFeatured && (
                          <Badge variant="outline" className="border-yellow-400 text-yellow-600 dark:text-yellow-400">
                            <StarIconSolid className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        &ldquo;{testimonial.text}&rdquo;
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {format(new Date(testimonial.submittedAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <span className="capitalize">{testimonial.source.toLowerCase().replace('_', ' ')}</span>
                        {testimonial.customer && (
                          <span>Cliente: {testimonial.customer.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canManageTestimonials && testimonial.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerate(testimonial.id, 'approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Aprobar testimonio"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerate(testimonial.id, 'reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Rechazar testimonio"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {canManageTestimonials && testimonial.status === 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(testimonial.id, testimonial.isFeatured)}
                          className={testimonial.isFeatured ? 'text-yellow-600' : 'text-gray-400'}
                          title={testimonial.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        >
                          <StarIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('view', testimonial)}
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {canManageTestimonials && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(testimonial.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Eliminar testimonio"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTestimonials(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTestimonials(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTestimonial(null);
        }}
        mode={modalMode}
        testimonial={selectedTestimonial}
        onSaved={() => {
          fetchTestimonials(pagination.page);
          fetchStats();
        }}
      />
    </div>
  );
}
