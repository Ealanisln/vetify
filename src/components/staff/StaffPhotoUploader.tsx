'use client';

import { ImageUploader } from '../ui/ImageUploader';

interface StaffPhotoUploaderProps {
  staffId: string;
  currentImage?: string | null;
  staffName: string;
  onUpdate?: (url: string | null) => void;
}

export function StaffPhotoUploader({
  staffId,
  currentImage,
  staffName,
  onUpdate,
}: StaffPhotoUploaderProps) {
  return (
    <ImageUploader
      imageType="staff-profile"
      entityId={staffId}
      currentImage={currentImage}
      aspectRatio="1:1"
      label={`Foto de ${staffName}`}
      description="Foto de perfil para la página pública"
      onUpload={(url) => onUpdate?.(url)}
      onDelete={() => onUpdate?.(null)}
    />
  );
}
