'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestimonialFormProps {
  clinicSlug: string;
  clinicName: string;
}

export default function TestimonialForm({ clinicSlug, clinicName }: TestimonialFormProps) {
  const [formData, setFormData] = useState({
    reviewerName: '',
    reviewerEmail: '',
    rating: 0,
    text: '',
    website: '', // Honeypot field
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!formData.reviewerName.trim()) {
      newErrors.reviewerName = 'Por favor ingresa tu nombre';
    }
    if (formData.rating === 0) {
      newErrors.rating = 'Por favor selecciona una calificacion';
    }
    if (!formData.text.trim()) {
      newErrors.text = 'Por favor escribe tu testimonio';
    } else if (formData.text.trim().length < 10) {
      newErrors.text = 'El testimonio debe tener al menos 10 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/public/${clinicSlug}/testimonios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: formData.reviewerName.trim(),
          reviewerEmail: formData.reviewerEmail.trim() || undefined,
          rating: formData.rating,
          text: formData.text.trim(),
          website: formData.website, // Honeypot
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success('Testimonio enviado correctamente');
      } else {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((err: { path: string[]; message: string }) => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          toast.error(data.message || 'Error al enviar el testimonio');
        }
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Error de conexion. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Gracias por tu testimonio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tu opinion ha sido enviada y sera revisada por {clinicName}.
          <br />
          Apreciamos mucho que hayas compartido tu experiencia.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false);
            setFormData({
              reviewerName: '',
              reviewerEmail: '',
              rating: 0,
              text: '',
              website: '',
            });
          }}
          variant="outline"
        >
          Enviar otro testimonio
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="reviewerName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tu nombre *
        </label>
        <input
          type="text"
          id="reviewerName"
          value={formData.reviewerName}
          onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#75a99c] focus:border-transparent transition-colors"
          placeholder="Ej: Maria Garcia"
        />
        {errors.reviewerName && (
          <p className="text-sm text-red-500 mt-1">{errors.reviewerName}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div>
        <label
          htmlFor="reviewerEmail"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tu email <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
        </label>
        <input
          type="email"
          id="reviewerEmail"
          value={formData.reviewerEmail}
          onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#75a99c] focus:border-transparent transition-colors"
          placeholder="ejemplo@email.com"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Solo se usara para contactarte si es necesario
        </p>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Calificacion *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#75a99c] rounded"
              aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  star <= (hoveredRating || formData.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
        {formData.rating > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formData.rating === 1 && 'Muy malo'}
            {formData.rating === 2 && 'Malo'}
            {formData.rating === 3 && 'Regular'}
            {formData.rating === 4 && 'Bueno'}
            {formData.rating === 5 && 'Excelente'}
          </p>
        )}
        {errors.rating && <p className="text-sm text-red-500 mt-1">{errors.rating}</p>}
      </div>

      {/* Text */}
      <div>
        <label
          htmlFor="text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tu experiencia *
        </label>
        <textarea
          id="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#75a99c] focus:border-transparent transition-colors resize-none"
          placeholder="Cuentanos sobre tu experiencia con nosotros..."
        />
        <div className="flex justify-between items-center mt-1">
          {errors.text ? (
            <p className="text-sm text-red-500">{errors.text}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">Minimo 10 caracteres</p>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formData.text.length} caracteres
          </span>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#75a99c] hover:bg-[#5b9788] text-white py-3"
        size="lg"
      >
        {loading ? (
          <>
            <span className="animate-spin mr-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Enviar testimonio
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Al enviar, aceptas que tu testimonio pueda ser publicado en nuestra pagina
      </p>
    </form>
  );
}
