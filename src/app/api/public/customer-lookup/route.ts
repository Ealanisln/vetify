import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const lookupSchema = z.object({
  tenantSlug: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
  message: "Se requiere teléfono o email"
});

/**
 * Public endpoint to lookup a customer and their pets by phone or email.
 * Used in the public booking form to suggest existing pets.
 *
 * Returns customer info and pets if found, without exposing sensitive data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = lookupSchema.parse(body);

    // Get tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: validatedData.tenantSlug,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        publicPageEnabled: true,
        publicBookingEnabled: true
      }
    });

    if (!tenant || !tenant.publicPageEnabled || !tenant.publicBookingEnabled) {
      return NextResponse.json(
        { success: false, error: 'Clínica no disponible' },
        { status: 404 }
      );
    }

    // Normalize phone number for comparison
    const normalizedPhone = validatedData.phone?.replace(/\D/g, '');

    // Search for customer by phone (priority) or email
    let customer = null;

    if (normalizedPhone) {
      customer = await prisma.customer.findFirst({
        where: {
          tenantId: tenant.id,
          phone: {
            contains: normalizedPhone.slice(-10) // Last 10 digits
          }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          pets: {
            where: {
              isDeceased: false
            },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true
            },
            orderBy: {
              name: 'asc'
            }
          }
        }
      });
    }

    // If not found by phone, try email
    if (!customer && validatedData.email) {
      customer = await prisma.customer.findFirst({
        where: {
          tenantId: tenant.id,
          email: {
            equals: validatedData.email,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          pets: {
            where: {
              isDeceased: false
            },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true
            },
            orderBy: {
              name: 'asc'
            }
          }
        }
      });
    }

    if (!customer) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'Cliente no encontrado'
      });
    }

    // Return customer info with pets (limited data for privacy)
    return NextResponse.json({
      success: true,
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        // Only return masked versions for privacy
        hasPhone: !!customer.phone,
        hasEmail: !!customer.email
      },
      pets: customer.pets.map(pet => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed
      }))
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in customer lookup:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
