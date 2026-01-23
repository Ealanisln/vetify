'use client';

import { ImageUploader, ImageSize } from '../ui/ImageUploader';

interface PetProfileImageProps {
  petId: string;
  currentImage?: string | null;
  petName: string;
  size?: ImageSize;
  showDescription?: boolean;
  onUpdate?: (url: string | null) => void;
}

export function PetProfileImage({
  petId,
  currentImage,
  petName,
  size = 'md',
  showDescription = true,
  onUpdate,
}: PetProfileImageProps) {
  return (
    <ImageUploader
      imageType="pet-profile"
      entityId={petId}
      currentImage={currentImage}
      aspectRatio="1:1"
      size={size}
      label={`Foto de ${petName}`}
      description={showDescription ? "Foto de perfil de la mascota" : undefined}
      onUpload={(url) => onUpdate?.(url)}
      onDelete={() => onUpdate?.(null)}
    />
  );
}
