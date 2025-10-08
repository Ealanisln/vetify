import { NextRequest, NextResponse } from 'next/server';
import { isSlugAvailable } from '../../../../lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { message: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({
        available: false,
        message: 'El slug solo puede contener letras minúsculas, números y guiones'
      });
    }

    const available = await isSlugAvailable(slug);

    return NextResponse.json({
      available,
      message: available 
        ? 'Esta URL está disponible' 
        : 'Esta URL ya está en uso'
    });

  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 