'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type AspectRatio = '1:1' | '16:9' | 'free';
export type ImageType = 'logo' | 'hero' | 'pet-profile';

interface ImageUploaderProps {
  imageType: ImageType;
  entityId?: string;
  currentImage?: string | null;
  onUpload?: (url: string) => void;
  onDelete?: () => void;
  aspectRatio?: AspectRatio;
  className?: string;
  label?: string;
  description?: string;
}

const ASPECT_RATIO_CLASSES: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  free: 'aspect-auto min-h-48',
};

export function ImageUploader({
  imageType,
  entityId,
  currentImage,
  onUpload,
  onDelete,
  aspectRatio = 'free',
  className,
  label,
  description,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage prop changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Solo se permiten JPG, PNG y WebP.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo excede el tamano maximo de 5MB');
        return;
      }

      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', imageType);
        if (entityId) {
          formData.append('entityId', entityId);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al subir la imagen');
        }

        setPreview(result.url);
        onUpload?.(result.url);
        toast.success('Imagen subida exitosamente');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
        setPreview(currentImage || null);
      } finally {
        setIsUploading(false);
      }
    },
    [imageType, entityId, currentImage, onUpload]
  );

  const handleDelete = useCallback(async () => {
    if (!preview) return;

    setIsDeleting(true);
    try {
      const params = new URLSearchParams({ imageType });
      if (entityId) params.append('entityId', entityId);

      const response = await fetch(`/api/upload?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar la imagen');
      }

      setPreview(null);
      onDelete?.();
      toast.success('Imagen eliminada exitosamente');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar la imagen'
      );
    } finally {
      setIsDeleting(false);
    }
  }, [imageType, entityId, preview, onDelete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input value to allow re-uploading same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors overflow-hidden',
          ASPECT_RATIO_CLASSES[aspectRatio],
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600',
          !preview && 'hover:border-primary cursor-pointer',
          (isUploading || isDeleting) && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={isUploading || isDeleting}
        />

        {preview ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading || isDeleting}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isUploading || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  Arrastra una imagen aqui o{' '}
                  <span className="text-primary font-medium">
                    haz clic para seleccionar
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG o WebP. Maximo 5MB.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}
