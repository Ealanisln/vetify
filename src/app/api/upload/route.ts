import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  uploadImage,
  deleteImage,
  extractPublicIdFromUrl,
  type ImageType,
} from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadSchema = z.object({
  imageType: z.enum(['logo', 'hero', 'pet-profile']),
  entityId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('imageType') as string;
    const entityId = formData.get('entityId') as string | null;

    // Validate inputs
    const validation = uploadSchema.safeParse({
      imageType,
      entityId: entityId || undefined,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos de entrada invalidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporciono ningun archivo' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG y WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamano maximo de 5MB' },
        { status: 400 }
      );
    }

    // Validate entity ownership for pet/customer images
    if (imageType === 'pet-profile' && entityId) {
      const pet = await prisma.pet.findFirst({
        where: { id: entityId, tenantId: tenant.id },
      });
      if (!pet) {
        return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
      }
    }

    // Get current image URL to delete old one after successful upload
    const currentUrl = await getCurrentImageUrl(
      tenant.id,
      imageType as ImageType,
      entityId
    );

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      tenantId: tenant.id,
      imageType: imageType as ImageType,
      entityId: entityId || undefined,
    });

    // Update database based on image type
    await updateDatabaseWithImage(
      tenant.id,
      imageType as ImageType,
      entityId,
      result.url
    );

    // Delete old image from Cloudinary if exists
    if (currentUrl) {
      const oldPublicId = extractPublicIdFromUrl(currentUrl);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
        } catch (error) {
          // Log but don't fail the request if old image deletion fails
          console.error('Failed to delete old image:', error);
        }
      }
    }

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      message: 'Imagen subida exitosamente',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('imageType') as ImageType | null;
    const entityId = searchParams.get('entityId');

    if (!imageType) {
      return NextResponse.json({ error: 'Tipo de imagen requerido' }, { status: 400 });
    }

    // Validate entity ownership for pet/customer images
    if (imageType === 'pet-profile' && entityId) {
      const pet = await prisma.pet.findFirst({
        where: { id: entityId, tenantId: tenant.id },
      });
      if (!pet) {
        return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
      }
    }

    // Get current image URL
    const currentUrl = await getCurrentImageUrl(tenant.id, imageType, entityId);

    if (currentUrl) {
      const publicId = extractPublicIdFromUrl(currentUrl);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    // Clear from database
    await clearImageFromDatabase(tenant.id, imageType, entityId);

    return NextResponse.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Error al eliminar la imagen' }, { status: 500 });
  }
}

async function updateDatabaseWithImage(
  tenantId: string,
  imageType: ImageType,
  entityId: string | null,
  url: string
) {
  switch (imageType) {
    case 'logo':
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { logo: url },
      });
      break;
    case 'hero':
      const tenantForHero = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      const currentImages =
        (tenantForHero?.publicImages as Record<string, unknown>) || {};
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { publicImages: { ...currentImages, hero: url } },
      });
      break;
    case 'pet-profile':
      if (entityId) {
        await prisma.pet.update({
          where: { id: entityId, tenantId },
          data: { profileImage: url },
        });
      }
      break;
  }
}

async function getCurrentImageUrl(
  tenantId: string,
  imageType: ImageType,
  entityId: string | null
): Promise<string | null> {
  switch (imageType) {
    case 'logo':
      const tenantLogo = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      return tenantLogo?.logo || null;
    case 'hero':
      const tenantHero = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      return (tenantHero?.publicImages as Record<string, string>)?.hero || null;
    case 'pet-profile':
      if (entityId) {
        const pet = await prisma.pet.findUnique({ where: { id: entityId } });
        return pet?.profileImage || null;
      }
      return null;
    default:
      return null;
  }
}

async function clearImageFromDatabase(
  tenantId: string,
  imageType: ImageType,
  entityId: string | null
) {
  switch (imageType) {
    case 'logo':
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { logo: null },
      });
      break;
    case 'hero':
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const currentImages =
        (tenant?.publicImages as Record<string, unknown>) || {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hero: _hero, ...rest } = currentImages as { hero?: string };
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { publicImages: Object.keys(rest).length ? rest : null },
      });
      break;
    case 'pet-profile':
      if (entityId) {
        await prisma.pet.update({
          where: { id: entityId },
          data: { profileImage: null },
        });
      }
      break;
  }
}
