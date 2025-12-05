import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { GalleryCategory, PublicImages } from '@/lib/tenant';

const reorderSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

const updateImageSchema = z.object({
  imageId: z.string().uuid(),
  category: z.enum(['instalaciones', 'equipo', 'pacientes']).optional(),
  caption: z.string().max(200).optional(),
});

// DELETE - Remove a gallery image
export async function DELETE(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la imagen' },
        { status: 400 }
      );
    }

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { publicImages: true },
    });

    const currentPublicImages = (tenantData?.publicImages as PublicImages) || {};
    const currentGallery = currentPublicImages.gallery || [];
    const imageToDelete = currentGallery.find((img) => img.id === imageId);

    if (!imageToDelete) {
      return NextResponse.json(
        { error: 'Imagen no encontrada en la galería' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    try {
      await deleteImage(imageToDelete.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }

    // Remove from gallery array and reorder
    const updatedGallery = currentGallery
      .filter((img) => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        publicImages: {
          ...currentPublicImages,
          gallery: updatedGallery,
        },
      },
    });

    return NextResponse.json({
      message: 'Imagen eliminada exitosamente',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la imagen' },
      { status: 500 }
    );
  }
}

// PATCH - Reorder gallery images
export async function PATCH(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const validation = reorderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { images: newOrder } = validation.data;

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { publicImages: true },
    });

    const currentPublicImages = (tenantData?.publicImages as PublicImages) || {};
    const currentGallery = currentPublicImages.gallery || [];

    // Create a map of new orders
    const orderMap = new Map(newOrder.map((item) => [item.id, item.order]));

    // Update orders and sort
    const updatedGallery = currentGallery
      .map((img) => ({
        ...img,
        order: orderMap.has(img.id) ? orderMap.get(img.id)! : img.order,
      }))
      .sort((a, b) => a.order - b.order);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        publicImages: {
          ...currentPublicImages,
          gallery: updatedGallery,
        },
      },
    });

    return NextResponse.json({
      message: 'Orden actualizado exitosamente',
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Error reordering gallery:', error);
    return NextResponse.json(
      { error: 'Error al reordenar la galería' },
      { status: 500 }
    );
  }
}

// PUT - Update image caption or category
export async function PUT(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const validation = updateImageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { imageId, category, caption } = validation.data;

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { publicImages: true },
    });

    const currentPublicImages = (tenantData?.publicImages as PublicImages) || {};
    const currentGallery = currentPublicImages.gallery || [];
    const imageIndex = currentGallery.findIndex((img) => img.id === imageId);

    if (imageIndex === -1) {
      return NextResponse.json(
        { error: 'Imagen no encontrada en la galería' },
        { status: 404 }
      );
    }

    // Update the image
    const updatedGallery = [...currentGallery];
    updatedGallery[imageIndex] = {
      ...updatedGallery[imageIndex],
      ...(category && { category: category as GalleryCategory }),
      ...(caption !== undefined && { caption }),
    };

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        publicImages: {
          ...currentPublicImages,
          gallery: updatedGallery,
        },
      },
    });

    return NextResponse.json({
      message: 'Imagen actualizada exitosamente',
      image: updatedGallery[imageIndex],
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la imagen' },
      { status: 500 }
    );
  }
}

// GET - Get gallery images
export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { publicImages: true },
    });

    const publicImages = (tenantData?.publicImages as PublicImages) || {};
    const gallery = publicImages.gallery || [];

    return NextResponse.json({
      gallery: gallery.sort((a, b) => a.order - b.order),
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Error al obtener la galería' },
      { status: 500 }
    );
  }
}
