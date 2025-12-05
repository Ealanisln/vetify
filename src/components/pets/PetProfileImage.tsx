'use client';

import { ImageUploader } from '../ui/ImageUploader';

interface PetProfileImageProps {
  petId: string;
  currentImage?: string | null;
  petName: string;
  onUpdate?: (url: string | null) => void;
}

export function PetProfileImage({
  petId,
  currentImage,
  petName,
  onUpdate,
}: PetProfileImageProps) {
  return (
    <ImageUploader
      imageType="pet-profile"
      entityId={petId}
      currentImage={currentImage}
      aspectRatio="1:1"
      label={`Foto de ${petName}`}
      description="Foto de perfil de la mascota"
      onUpload={(url) => onUpdate?.(url)}
      onDelete={() => onUpdate?.(null)}
    />
  );
}
