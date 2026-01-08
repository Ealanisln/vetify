'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Loader2, Upload, Trash2, Bug, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  screenshots: File[];
}

const initialFormState: FormState = {
  description: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  screenshots: [],
};

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      // Only allow images up to 5MB
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es demasiado grande (máx. 5MB)`);
        return false;
      }
      return true;
    });

    setFormState((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, ...validFiles].slice(0, 3), // Max 3 files
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeScreenshot = useCallback((index: number) => {
    setFormState((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formState.description.trim()) {
      toast.error('Por favor describe el error');
      return;
    }
    if (!formState.stepsToReproduce.trim()) {
      toast.error('Por favor indica los pasos para reproducir el error');
      return;
    }
    if (!formState.expectedBehavior.trim()) {
      toast.error('Por favor indica el comportamiento esperado');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', formState.description);
      formData.append('stepsToReproduce', formState.stepsToReproduce);
      formData.append('expectedBehavior', formState.expectedBehavior);
      formData.append('currentUrl', window.location.href);
      formData.append('userAgent', navigator.userAgent);

      formState.screenshots.forEach((file) => {
        formData.append('screenshots', file);
      });

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      setIsSuccess(true);
      toast.success('Reporte enviado exitosamente. Gracias por ayudarnos a mejorar.');

      // Reset and close after delay
      setTimeout(() => {
        setFormState(initialFormState);
        setIsSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar el reporte'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormState(initialFormState);
      setIsSuccess(false);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Bug className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2
                id="bug-report-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Reportar un error
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ayúdanos a mejorar Vetify
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ¡Gracias por tu reporte!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Revisaremos el problema lo antes posible.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Descripción del error <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formState.description}
                  onChange={handleInputChange('description')}
                  placeholder="Describe brevemente el error que encontraste..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>

              {/* Steps to reproduce */}
              <div>
                <label
                  htmlFor="stepsToReproduce"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Pasos para reproducir <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="stepsToReproduce"
                  value={formState.stepsToReproduce}
                  onChange={handleInputChange('stepsToReproduce')}
                  placeholder="1. Ir a la página...&#10;2. Hacer clic en...&#10;3. Observar que..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>

              {/* Expected behavior */}
              <div>
                <label
                  htmlFor="expectedBehavior"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Comportamiento esperado <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="expectedBehavior"
                  value={formState.expectedBehavior}
                  onChange={handleInputChange('expectedBehavior')}
                  placeholder="¿Qué esperabas que sucediera?"
                  rows={2}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>

              {/* Screenshots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Capturas de pantalla{' '}
                  <span className="text-gray-400 font-normal">(opcional, máx. 3)</span>
                </label>

                {/* File upload button */}
                {formState.screenshots.length < 3 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Subir imagen
                      </span>
                    </label>
                  </div>
                )}

                {/* Screenshot previews */}
                {formState.screenshots.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formState.screenshots.map((file, index) => (
                      <div
                        key={index}
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          disabled={isSubmitting}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          aria-label={`Eliminar imagen ${index + 1}`}
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar reporte'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
