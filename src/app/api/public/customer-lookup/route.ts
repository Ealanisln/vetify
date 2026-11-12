import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { phoneMatchKey } from '../../../../lib/phone';
import { findCustomersByPhone, namesMatch } from '../../../../lib/customer-identification';

const lookupSchema = z
  .object({
    tenantSlug: z.string().min(1),
    phone: z.string().refine((phone) => phoneMatchKey(phone) !== null),
    customerName: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((data) => data.customerName || data.email);

/**
 * Public endpoint used by the booking form to offer the caller's own pets.
 *
 * Anyone can call it, so it only answers when the caller proves who they are
 * with two factors: the full phone number (normalized, exact match) plus the
 * customer's name or email exactly as the clinic has them. It returns nothing
 * about the customer, only the id and name of their living pets, and the
 * response for "no match" is identical to "match without pets", so it cannot
 * be used to learn whether a phone number belongs to a client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = lookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { tenantSlug, phone, customerName, email } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
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

    const phoneMatches = await findCustomersByPhone(tenant.id, phone);
    const customer = phoneMatches.find(
      (candidate) =>
        (customerName && namesMatch(candidate.name, customerName)) ||
        (email && candidate.email?.trim().toLowerCase() === email.toLowerCase())
    );

    const pets = customer
      ? await prisma.pet.findMany({
          where: {
            tenantId: tenant.id,
            customerId: customer.id,
            isDeceased: false
          },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        })
      : [];

    return NextResponse.json({
      success: true,
      pets: pets.map((pet) => ({ id: pet.id, name: pet.name }))
    });
  } catch (error) {
    console.error('Error in customer lookup:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
