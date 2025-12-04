import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// Schema for public page settings validation
const publicPageSettingsSchema = z.object({
  publicPageEnabled: z.boolean(),
  publicBookingEnabled: z.boolean(),
  publicDescription: z.string().max(1000).nullable().optional(),
  publicPhone: z.string().max(20).nullable().optional(),
  publicEmail: z.string().email().max(100).nullable().optional().or(z.literal('')),
  publicAddress: z.string().max(500).nullable().optional(),
  publicThemeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  publicHours: z.object({
    weekdays: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }).nullable().optional(),
  publicServices: z.array(z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500),
    price: z.string().max(50).optional(),
    icon: z.string().max(50).optional(),
  })).max(10).nullable().optional(),
  publicSocialMedia: z.object({
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    whatsapp: z.string().max(20).optional().or(z.literal('')),
  }).nullable().optional(),
});

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
        slug: true,
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: true,
        publicPhone: true,
        publicEmail: true,
        publicAddress: true,
        publicThemeColor: true,
        publicHours: true,
        publicServices: true,
        publicSocialMedia: true,
        publicImages: true,
        logo: true,
      },
    });

    if (!tenantData) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: tenantData });
  } catch (error) {
    console.error('Error fetching public page settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    // Validate input
    const validationResult = publicPageSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Clean up empty strings to null
    const cleanedData = {
      publicPageEnabled: data.publicPageEnabled,
      publicBookingEnabled: data.publicBookingEnabled,
      publicDescription: data.publicDescription || null,
      publicPhone: data.publicPhone || null,
      publicEmail: data.publicEmail || null,
      publicAddress: data.publicAddress || null,
      publicThemeColor: data.publicThemeColor || '#75a99c',
      publicHours: data.publicHours || null,
      publicServices: data.publicServices || null,
      publicSocialMedia: data.publicSocialMedia ? {
        facebook: data.publicSocialMedia.facebook || undefined,
        instagram: data.publicSocialMedia.instagram || undefined,
        twitter: data.publicSocialMedia.twitter || undefined,
        whatsapp: data.publicSocialMedia.whatsapp || undefined,
      } : null,
    };

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: cleanedData,
      select: {
        slug: true,
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: true,
        publicPhone: true,
        publicEmail: true,
        publicAddress: true,
        publicThemeColor: true,
        publicHours: true,
        publicServices: true,
        publicSocialMedia: true,
        publicImages: true,
        logo: true,
      },
    });

    return NextResponse.json({
      data: updatedTenant,
      message: 'Configuración guardada exitosamente'
    });
  } catch (error) {
    console.error('Error updating public page settings:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración' },
      { status: 500 }
    );
  }
}
