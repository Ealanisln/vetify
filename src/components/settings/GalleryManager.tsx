'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  GripVertical,
  Pencil,
  Building2,
  Users,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { GalleryImage, GalleryCategory } from '@/lib/tenant';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_GALLERY_IMAGES = 10;

interface GalleryManagerProps {
  gallery: GalleryImage[];
  onUpdate: (gallery: GalleryImage[]) => void;
}

const CATEGORY_OPTIONS: { value: GalleryCategory; label: string }[] = [
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'pacientes', label: 'Pacientes' },
];

const CATEGORY_ICONS: Record<GalleryCategory, React.ReactNode> = {
  instalaciones: <Building2 className="h-4 w-4" />,
  equipo: <Users className="h-4 w-4" />,
  pacientes: <Heart className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<GalleryCategory, string> = {
  instalaciones: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  equipo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  pacientes: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

interface SortableImageCardProps {
  image: GalleryImage;
  onDelete: (id: string) => void;
  onEdit: (image: GalleryImage) => void;
  isDeleting: boolean;
}

function SortableImageCard({ image, onDelete, onEdit, isDeleting }: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <div className="aspect-[4/3] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.caption || 'Gallery image'}
          className="w-full h-full object-cover"
        />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded bg-white/90 dark:bg-gray-800/90 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>

        {/* Category badge */}
        <span
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium',
            CATEGORY_COLORS[image.category]
          )}
        >
          {CATEGORY_OPTIONS.find((c) => c.value === image.category)?.label}
        </span>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={() => onEdit(image)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Caption */}
      {image.caption && (
        <div className="p-2 text-sm text-gray-600 dark:text-gray-400 truncate">
          {image.caption}
        </div>
      )}
    </div>
  );
}

export function GalleryManager({ gallery, onUpdate }: GalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState<GalleryCategory>('instalaciones');
  const [uploadCategory, setUploadCategory] = useState<GalleryCategory>('instalaciones');
  const [filterCategory, setFilterCategory] = useState<GalleryCategory | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredGallery = filterCategory === 'all'
    ? gallery
    : gallery.filter((img) => img.category === filterCategory);

  const sortedGallery = [...gallery].sort((a, b) => a.order - b.order);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const remainingSlots = MAX_GALLERY_IMAGES - gallery.length;
      if (remainingSlots <= 0) {
        toast.error(`Has alcanzado el límite de ${MAX_GALLERY_IMAGES} imágenes`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToUpload) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: Tipo de archivo no permitido`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: Excede el tamaño máximo de 5MB`);
          continue;
        }

        setIsUploading(true);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('imageType', 'gallery');
          formData.append('category', uploadCategory);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Error al subir la imagen');
          }

          onUpdate([...gallery, result.image]);
          toast.success('Imagen agregada a la galería');
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
        }
      }

      setIsUploading(false);
    },
    [gallery, onUpdate, uploadCategory]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      setDeletingId(imageId);
      try {
        const response = await fetch(`/api/gallery?imageId=${imageId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al eliminar la imagen');
        }

        onUpdate(result.gallery);
        toast.success('Imagen eliminada');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error instanceof Error ? error.message : 'Error al eliminar');
      } finally {
        setDeletingId(null);
      }
    },
    [onUpdate]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sortedGallery.findIndex((img) => img.id === active.id);
        const newIndex = sortedGallery.findIndex((img) => img.id === over.id);

        const newOrder = arrayMove(sortedGallery, oldIndex, newIndex).map(
          (img, index) => ({ ...img, order: index })
        );

        onUpdate(newOrder);

        try {
          const response = await fetch('/api/gallery', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: newOrder.map((img) => ({ id: img.id, order: img.order })),
            }),
          });

          if (!response.ok) {
            throw new Error('Error al reordenar');
          }
        } catch (error) {
          console.error('Reorder error:', error);
          toast.error('Error al guardar el nuevo orden');
          onUpdate(sortedGallery);
        }
      }
    },
    [sortedGallery, onUpdate]
  );

  const handleEditSave = useCallback(async () => {
    if (!editingImage) return;

    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: editingImage.id,
          caption: editCaption,
          category: editCategory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar');
      }

      const updatedGallery = gallery.map((img) =>
        img.id === editingImage.id ? result.image : img
      );
      onUpdate(updatedGallery);
      setEditingImage(null);
      toast.success('Imagen actualizada');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar');
    }
  }, [editingImage, editCaption, editCategory, gallery, onUpdate]);

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
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  const openEditDialog = useCallback((image: GalleryImage) => {
    setEditingImage(image);
    setEditCaption(image.caption || '');
    setEditCategory(image.category);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Galería de Imágenes</h3>
          <p className="text-sm text-gray-500">
            {gallery.length}/{MAX_GALLERY_IMAGES} imágenes
          </p>
        </div>
      </div>

      {/* Category filter - also sets upload category */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          Todas
        </Button>
        {CATEGORY_OPTIONS.map((cat) => (
          <Button
            key={cat.value}
            type="button"
            variant={filterCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilterCategory(cat.value);
              setUploadCategory(cat.value);
            }}
            className="gap-1"
          >
            {CATEGORY_ICONS[cat.value]}
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Upload category indicator */}
      {gallery.length < MAX_GALLERY_IMAGES && filterCategory !== 'all' && (
        <p className="text-sm text-muted-foreground">
          Las nuevas imágenes se agregarán a: <span className="font-medium text-foreground">{CATEGORY_OPTIONS.find(c => c.value === uploadCategory)?.label}</span>
        </p>
      )}

      {/* Upload zone */}
      {gallery.length < MAX_GALLERY_IMAGES && (
        <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary',
              isUploading && 'pointer-events-none opacity-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              disabled={isUploading}
            />

            {isUploading ? (
              <Loader2 className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  Arrastra imágenes aquí o{' '}
                  <span className="text-primary font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG o WebP. Máximo 5MB por imagen.
                </p>
              </>
            )}
          </div>
      )}

      {/* Gallery grid with drag and drop */}
      {filteredGallery.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredGallery.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredGallery
                .sort((a, b) => a.order - b.order)
                .map((image) => (
                  <SortableImageCard
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                    onEdit={openEditDialog}
                    isDeleting={deletingId === image.id}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay imágenes en la galería</p>
          <p className="text-sm">Sube imágenes para mostrar en tu página pública</p>
        </div>
      )}

      {/* Edit modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar imagen</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editingImage.url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GalleryCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción (opcional)</label>
                <Input
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Describe la imagen..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">
                  {editCaption.length}/200
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setEditingImage(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleEditSave}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
