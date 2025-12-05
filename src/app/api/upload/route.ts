import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_TYPES = ['logo', 'hero'] as const;

type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return extensions[mimeType] || 'jpg';
}

export async function POST(request: Request) {
  try {
    const { tenant } = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('imageType') as string | null;
    const existingUrl = formData.get('existingUrl') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    if (!imageType || !ALLOWED_IMAGE_TYPES.includes(imageType as ImageType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de imagen inválido' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de archivo no soportado. Use: JPG, PNG o WebP',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `El archivo es muy grande. Máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 413 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = getFileExtension(file.type);
    const sanitizedName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
    const filename = `${timestamp}-${sanitizedName}.${extension}`;
    const storagePath = `${tenant.id}/${imageType}/${filename}`;

    // Create Supabase client
    const supabase = await createClient();

    // Delete existing image if provided
    if (existingUrl) {
      try {
        const urlPath = new URL(existingUrl).pathname;
        const pathMatch = urlPath.match(/\/tenant-assets\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('tenant-assets').remove([pathMatch[1]]);
        }
      } catch {
        // Ignore errors when deleting old file
        console.warn('Could not delete existing image:', existingUrl);
      }
    }

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Error al subir el archivo' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('tenant-assets').getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { tenant } = await requireAuth();

    const { path } = await request.json();

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Path no proporcionado' },
        { status: 400 }
      );
    }

    // Validate that the path belongs to the tenant
    if (!path.startsWith(`${tenant.id}/`)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.storage.from('tenant-assets').remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
