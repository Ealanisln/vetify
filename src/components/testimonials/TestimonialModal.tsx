'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { TestimonialStatus } from '@prisma/client';

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
  customer?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  appointment?: {
    id: string;
    dateTime: Date;
    reason: string;
  } | null;
  moderatedBy?: {
    id: string;
    name: string;
  } | null;
}

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  testimonial?: Testimonial | null;
  onSaved: () => void;
}

const statusConfig: Record<TestimonialStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
  ARCHIVED: { label: 'Archivado', variant: 'secondary' },
};

export default function TestimonialModal({
  isOpen,
  onClose,
  mode,
  testimonial,
  onSaved,
}: TestimonialModalProps) {
  const [formData, setFormData] = useState({
    reviewerName: '',
    reviewerEmail: '',
    rating: 5,
    text: '',
    status: 'PENDING' as TestimonialStatus,
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (testimonial && (mode === 'edit' || mode === 'view')) {
      setFormData({
        reviewerName: testimonial.reviewerName,
        reviewerEmail: testimonial.reviewerEmail || '',
        rating: testimonial.rating,
        text: testimonial.text,
        status: testimonial.status,
        isFeatured: testimonial.isFeatured,
      });
    } else {
      setFormData({
        reviewerName: '',
        reviewerEmail: '',
        rating: 5,
        text: '',
        status: 'PENDING',
        isFeatured: false,
      });
    }
    setErrors({});
  }, [testimonial, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const url = mode === 'create' ? '/api/testimonials' : `/api/testimonials/${testimonial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(mode === 'create' ? 'Testimonio creado' : 'Testimonio actualizado');
        onSaved();
        onClose();
      } else {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((err: { path: string[]; message: string }) => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          toast.error(data.message || 'Error al guardar');
        }
      }
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => mode !== 'view' && setFormData({ ...formData, rating: star })}
            className={`p-1 ${mode === 'view' ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
            disabled={mode === 'view'}
          >
            {star <= formData.rating ? (
              <StarIconSolid className="h-8 w-8 text-yellow-400" />
            ) : (
              <StarIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const isViewMode = mode === 'view';

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Nuevo Testimonio';
      case 'edit': return 'Editar Testimonio';
      case 'view': return 'Ver Testimonio';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Badge (view/edit only) */}
          {testimonial && (
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig[formData.status].variant}>
                {statusConfig[formData.status].label}
              </Badge>
              {formData.isFeatured && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600 dark:text-yellow-400">
                  <StarIconSolid className="h-3 w-3 mr-1" />
                  Destacado
                </Badge>
              )}
            </div>
          )}

          {/* Reviewer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del cliente *
            </label>
            <input
              type="text"
              value={formData.reviewerName}
              onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
              required
            />
            {errors.reviewerName && (
              <p className="text-sm text-red-500 mt-1">{errors.reviewerName}</p>
            )}
          </div>

          {/* Reviewer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              value={formData.reviewerEmail}
              onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calificación *
            </label>
            {renderStarPicker()}
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Testimonio *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              disabled={isViewMode}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 resize-none"
              required
            />
            {errors.text && (
              <p className="text-sm text-red-500 mt-1">{errors.text}</p>
            )}
          </div>

          {/* Status (edit only) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TestimonialStatus })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobado</option>
                <option value="REJECTED">Rechazado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>
          )}

          {/* Featured Toggle (edit only) */}
          {mode === 'edit' && formData.status === 'APPROVED' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#75a99c] focus:ring-[#75a99c]"
              />
              <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">
                Destacar en página pública
              </label>
            </div>
          )}

          {/* Metadata (view only) */}
          {isViewMode && testimonial && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Recibido:</strong>{' '}
                {format(new Date(testimonial.submittedAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Fuente:</strong> {testimonial.source.toLowerCase().replace('_', ' ')}
              </p>
              {testimonial.customer && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Cliente vinculado:</strong> {testimonial.customer.name}
                </p>
              )}
              {testimonial.moderatedAt && testimonial.moderatedBy && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Moderado por:</strong> {testimonial.moderatedBy.name} el{' '}
                  {format(new Date(testimonial.moderatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
              {testimonial.moderationNote && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Nota:</strong> {testimonial.moderationNote}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewMode ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#75a99c] hover:bg-[#5b9788]"
              >
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
