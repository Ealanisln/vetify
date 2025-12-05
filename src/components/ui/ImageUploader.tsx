'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  /** Current image URL (for preview) */
  value?: string | null;
  /** Callback when upload completes successfully */
  onChange: (url: string | null) => void;
  /** Type of image being uploaded - affects storage path */
  imageType: 'logo' | 'hero';
  /** Aspect ratio for preview */
  aspectRatio?: '1:1' | '16:9';
  /** Maximum file size in MB (default: 5) */
  maxSizeMB?: number;
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Custom className for styling */
  className?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  value,
  onChange,
  imageType,
  aspectRatio = 'free',
  maxSizeMB = 5,
  placeholder = 'Arrastra una imagen o haz clic para seleccionar',
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass =
    aspectRatio === '1:1'
      ? 'aspect-square'
      : aspectRatio === '16:9'
        ? 'aspect-video'
        : 'aspect-video';

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Tipo de archivo no soportado. Use: JPG, PNG o WebP';
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        return `El archivo es muy grande. Máximo: ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSizeMB]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', imageType);
        if (value) {
          formData.append('existingUrl', value);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Error al subir imagen');
        }

        onChange(result.url);
        setPreviewUrl(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(localPreview);
      }
    },
    [imageType, onChange, value]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      uploadFile(file);
    },
    [validateFile, uploadFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setError(null);
      onChange(null);
    },
    [onChange]
  );

  const displayUrl = previewUrl || value;

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden rounded-lg border-2 border-dashed transition-all cursor-pointer',
          aspectRatioClass,
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'cursor-wait'
        )}
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay with remove button */}
            {!isUploading && !disabled && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  className="shadow-lg"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Subiendo imagen...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  {isDragging ? (
                    <Upload className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  {isDragging ? 'Suelta la imagen aquí' : placeholder}
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG o WebP (máx. {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && displayUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
