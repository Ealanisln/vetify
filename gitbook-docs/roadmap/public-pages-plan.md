# Plan Maestro: Páginas Públicas de Clínicas con Identificación Inteligente

## Objetivo
Crear páginas públicas accesibles via `vetify.app/clinica-san-martin` donde los clientes puedan:
- Ver información de la clínica
- Ver servicios disponibles
- Agendar citas directamente con **identificación automática**
- Ver horarios de atención
- **Vinculación inteligente** con perfiles existentes
- **Gestión de duplicados** para el staff
****
## Fase 1: Estructura de Rutas y Base de Datos

### 1.1 Actualizar Prisma Schema
Agregar campos necesarios para las páginas públicas y sistema de identificación en el modelo `Tenant`:

```prisma
model Tenant {
  // ... campos existentes ...
  
  // Campos para página pública
  publicPageEnabled    Boolean             @default(false)
  publicDescription    String?             @db.Text
  publicPhone          String?
  publicEmail          String?
  publicAddress        String?             @db.Text
  publicHours          Json?               // Horarios de atención
  publicServices       Json?               // Servicios destacados
  publicImages         Json?               // URLs de imágenes
  publicSocialMedia    Json?               // Redes sociales
  publicThemeColor     String?             @default("#75a99c")
  publicBookingEnabled Boolean             @default(true)
  
  // ... resto de campos ...
}

model Customer {
  id                   String                @id @default(uuid())
  tenantId             String
  name                 String
  phone                String?
  email                String?
  address              String?
  source               String?               @default("MANUAL") // MANUAL, PUBLIC_BOOKING, IMPORT
  needsReview          Boolean               @default(false)    // Flag para duplicados
  reviewedAt           DateTime?
  reviewedBy           String?               // Staff ID que revisó
  mergedFrom           String[]              // IDs de clientes fusionados
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Relaciones existentes
  tenant               Tenant                @relation(fields: [tenantId], references: [id])
  pets                 Pet[]
  appointments         Appointment[]
  appointmentRequests  AppointmentRequest[]  // Nueva relación
  user                 User?                 @relation(fields: [userId], references: [id])
  userId               String?
  
  @@index([tenantId, needsReview])
  @@index([tenantId, phone])
  @@index([tenantId, email])
  @@index([tenantId, source])
}

model AppointmentRequest {
  id             String                    @id @default(uuid())
  tenantId       String
  customerId     String
  petName        String
  service        String?
  preferredDate  DateTime?
  preferredTime  String?
  notes          String?                   @db.Text
  status         AppointmentRequestStatus  @default(PENDING)
  source         String                    @default("PUBLIC_BOOKING")
  
  // Campos para seguimiento de identificación
  identificationStatus String?             // 'existing', 'new', 'needs_review'
  similarCustomerIds   String[]            // IDs de posibles duplicados
  reviewNotes          String?             @db.Text
  
  createdAt      DateTime                  @default(now())
  updatedAt      DateTime                  @updatedAt
  
  tenant         Tenant                    @relation(fields: [tenantId], references: [id])
  customer       Customer                  @relation(fields: [customerId], references: [id])
  
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
  @@index([tenantId, identificationStatus])
}

enum AppointmentRequestStatus {
  PENDING
  CONFIRMED
  REJECTED
  CANCELLED
  CONVERTED_TO_APPOINTMENT
}
```

**Migración:**
```bash
npx prisma migrate dev --name add_public_pages_and_smart_identification
```

### 1.2 Crear Estructura de Rutas
Crear el directorio y archivos para la ruta dinámica:

```
src/app/[clinicSlug]/
├── page.tsx                 # Página principal de la clínica
├── agendar/
│   └── page.tsx            # Página de agendamiento
├── servicios/
│   └── page.tsx            # Página de servicios
└── layout.tsx              # Layout específico para páginas públicas
```

## Fase 2: Sistema de Identificación Inteligente

### 2.1 Funciones de Identificación de Clientes
**Archivo:** `src/lib/customer-identification.ts`

```typescript
import { prisma } from '@/lib/prisma';

export interface CustomerIdentificationResult {
  customer: any;
  status: 'existing' | 'new' | 'needs_review';
  existingPets?: any[];
  hasUserAccount: boolean;
  similarCustomers?: any[];
  confidence: 'high' | 'medium' | 'low';
}

export async function findOrCreateCustomer({
  tenantId,
  phone,
  email,
  name
}: {
  tenantId: string;
  phone: string;
  email?: string;
  name: string;
}): Promise<CustomerIdentificationResult> {
  
  // 1️⃣ BÚSQUEDA EXACTA POR TELÉFONO (ALTA CONFIANZA)
  const phoneMatch = await prisma.customer.findFirst({
    where: {
      tenantId,
      phone: phone
    },
    include: {
      pets: true,
      user: true,
      appointmentRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (phoneMatch) {
    // Actualizar email si no tenía y ahora proporcionó uno
    if (email && !phoneMatch.email) {
      await prisma.customer.update({
        where: { id: phoneMatch.id },
        data: { email }
      });
      phoneMatch.email = email;
    }

    return {
      customer: phoneMatch,
      status: 'existing',
      existingPets: phoneMatch.pets,
      hasUserAccount: !!phoneMatch.user,
      confidence: 'high'
    };
  }

  // 2️⃣ BÚSQUEDA EXACTA POR EMAIL (ALTA CONFIANZA)
  let emailMatch = null;
  if (email) {
    emailMatch = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: email
      },
      include: {
        pets: true,
        user: true
      }
    });

    if (emailMatch) {
      // Actualizar teléfono si no tenía
      if (!emailMatch.phone) {
        await prisma.customer.update({
          where: { id: emailMatch.id },
          data: { phone }
        });
        emailMatch.phone = phone;
      }

      return {
        customer: emailMatch,
        status: 'existing',
        existingPets: emailMatch.pets,
        hasUserAccount: !!emailMatch.user,
        confidence: 'high'
      };
    }
  }

  // 3️⃣ BÚSQUEDA FUZZY POR NOMBRE (CONFIANZA MEDIA/BAJA)
  const similarCustomers = await findSimilarCustomers(tenantId, name, phone, email);

  // 4️⃣ CREAR NUEVO CLIENTE
  const needsReview = similarCustomers.length > 0;
  
  const newCustomer = await prisma.customer.create({
    data: {
      tenantId,
      name,
      phone,
      email,
      source: 'PUBLIC_BOOKING',
      needsReview
    },
    include: {
      pets: true,
      user: true
    }
  });

  return {
    customer: newCustomer,
    status: needsReview ? 'needs_review' : 'new',
    existingPets: [],
    hasUserAccount: false,
    similarCustomers,
    confidence: needsReview ? 'low' : 'high'
  };
}

async function findSimilarCustomers(
  tenantId: string, 
  name: string, 
  phone: string, 
  email?: string
) {
  const nameWords = name.toLowerCase().split(' ');
  const firstName = nameWords[0];
  const lastName = nameWords[nameWords.length - 1];

  // Buscar por similitud de nombre
  const nameSimilar = await prisma.customer.findMany({
    where: {
      tenantId,
      OR: [
        {
          name: {
            contains: firstName,
            mode: 'insensitive'
          }
        },
        ...(lastName !== firstName ? [{
          name: {
            contains: lastName,
            mode: 'insensitive'
          }
        }] : [])
      ]
    },
    include: {
      pets: true
    },
    take: 5
  });

  // Filtrar resultados con score de similitud
  return nameSimilar
    .map(customer => ({
      ...customer,
      similarityScore: calculateSimilarityScore(
        { name, phone, email },
        { name: customer.name, phone: customer.phone, email: customer.email }
      )
    }))
    .filter(customer => customer.similarityScore > 0.3)
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

function calculateSimilarityScore(
  input: { name: string; phone: string; email?: string },
  existing: { name: string; phone: string | null; email: string | null }
): number {
  let score = 0;
  
  // Similitud de nombre (peso: 0.6)
  const nameScore = levenshteinSimilarity(
    input.name.toLowerCase(), 
    existing.name.toLowerCase()
  );
  score += nameScore * 0.6;
  
  // Similitud de teléfono (peso: 0.3)
  if (existing.phone) {
    const phoneScore = input.phone === existing.phone ? 1 : 0;
    score += phoneScore * 0.3;
  }
  
  // Similitud de email (peso: 0.1)
  if (input.email && existing.email) {
    const emailScore = input.email.toLowerCase() === existing.email.toLowerCase() ? 1 : 0;
    score += emailScore * 0.1;
  }
  
  return score;
}

function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function createPublicAppointmentRequest({
  tenantId,
  customerId,
  appointmentData,
  identificationResult
}: {
  tenantId: string;
  customerId: string;
  appointmentData: {
    petName: string;
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
  };
  identificationResult: CustomerIdentificationResult;
}) {
  return await prisma.appointmentRequest.create({
    data: {
      tenantId,
      customerId,
      petName: appointmentData.petName,
      service: appointmentData.service,
      preferredDate: appointmentData.preferredDate ? new Date(appointmentData.preferredDate) : null,
      preferredTime: appointmentData.preferredTime,
      notes: appointmentData.notes,
      status: 'PENDING',
      source: 'PUBLIC_BOOKING',
      identificationStatus: identificationResult.status,
      similarCustomerIds: identificationResult.similarCustomers?.map(c => c.id) || [],
      reviewNotes: identificationResult.status === 'needs_review' 
        ? `Similitud encontrada con ${identificationResult.similarCustomers?.length} clientes existentes`
        : null
    },
    include: {
      customer: {
        include: {
          pets: true,
          user: true
        }
      }
    }
  });
}
```

## Fase 3: Componentes Base

### 3.1 Layout Público
**Archivo:** `src/app/[clinicSlug]/layout.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: { clinicSlug: string } 
}): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.clinicSlug);
  
  if (!tenant) {
    return {
      title: 'Clínica no encontrada'
    };
  }

  return {
    title: `${tenant.name} | Clínica Veterinaria`,
    description: tenant.publicDescription || `Agenda tu cita en ${tenant.name}`,
    openGraph: {
      title: tenant.name,
      description: tenant.publicDescription || `Agenda tu cita en ${tenant.name}`,
      type: 'website',
      url: `https://vetify.app/${tenant.slug}`,
    }
  };
}

export default async function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { clinicSlug: string };
}) {
  const tenant = await getTenantBySlug(params.clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar tenant={tenant} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter tenant={tenant} />
    </div>
  );
}
```

### 3.2 Página Principal de Clínica
**Archivo:** `src/app/[clinicSlug]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { ClinicHero } from '@/components/public/ClinicHero';
import { ClinicServices } from '@/components/public/ClinicServices';
import { ClinicInfo } from '@/components/public/ClinicInfo';
import { QuickBooking } from '@/components/public/QuickBooking';

export default async function ClinicPage({
  params
}: {
  params: { clinicSlug: string };
}) {
  const tenant = await getTenantBySlug(params.clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  return (
    <>
      <ClinicHero tenant={tenant} />
      <QuickBooking tenant={tenant} />
      <ClinicServices tenant={tenant} />
      <ClinicInfo tenant={tenant} />
    </>
  );
}
```

## Fase 5: Componentes UI con Identificación Inteligente

### 5.1 Hero de Clínica
**Archivo:** `src/components/public/ClinicHero.tsx`

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock } from 'lucide-react';
import type { Tenant } from '@prisma/client';

interface ClinicHeroProps {
  tenant: Tenant;
}

export function ClinicHero({ tenant }: ClinicHeroProps) {
  const publicImages = tenant.publicImages as any;
  const publicHours = tenant.publicHours as any;

  return (
    <section className="relative bg-gradient-to-r from-blue-50 to-green-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Información de la clínica */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {tenant.name}
            </h1>
            
            {tenant.publicDescription && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {tenant.publicDescription}
              </p>
            )}

            {/* Información de contacto */}
            <div className="space-y-4 mb-8">
              {tenant.publicPhone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 text-[#75a99c] mr-3" />
                  <span>{tenant.publicPhone}</span>
                </div>
              )}
              
              {tenant.publicAddress && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 text-[#75a99c] mr-3" />
                  <span>{tenant.publicAddress}</span>
                </div>
              )}
              
              {publicHours && (
                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 text-[#75a99c] mr-3" />
                  <span>Lun-Vie: {publicHours.weekdays || '9:00 - 18:00'}</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/${tenant.slug}/agendar`}>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#75a99c] hover:bg-[#5b9788]"
                >
                  Agendar Cita
                </Button>
              </Link>
              
              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Llamar Ahora
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Imagen de la clínica */}
          <div className="relative">
            {publicImages?.hero ? (
              <Image
                src={publicImages.hero}
                alt={`${tenant.name} - Clínica Veterinaria`}
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            ) : (
              <div className="bg-gradient-to-br from-[#75a99c] to-[#5b9788] rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🐾</div>
                  <h3 className="text-2xl font-semibold">Cuidamos a tu mascota</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 5.2 Reserva Rápida con Identificación Inteligente
**Archivo:** `src/components/public/QuickBooking.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, User, ArrowRight, Users, Clock, Pet } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@prisma/client';

interface QuickBookingProps {
  tenant: Tenant;
}

interface SubmissionResult {
  success: boolean;
  data?: {
    appointmentRequest: any;
    customerStatus: 'existing' | 'new' | 'needs_review';
    existingPets: any[];
    hasAccount: boolean;
    confidence: 'high' | 'medium' | 'low';
    loginPrompt?: {
      message: string;
      loginUrl: string;
    };
    similarCustomers?: any[];
  };
  error?: string;
}

export function QuickBooking({ tenant }: QuickBookingProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    petName: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          ...formData
        })
      });

      const result = await response.json();
      setSubmissionResult(result);
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setSubmissionResult({
        success: false,
        error: 'Error al enviar la solicitud. Por favor intenta de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🎉 MOSTRAR RESULTADO DE LA SOLICITUD
  if (submissionResult?.success) {
    const data = submissionResult.data!;
    
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Hemos recibido tu solicitud de cita. Nos contactaremos contigo pronto para confirmar.
            </p>

            {/* 🔍 INFORMACIÓN DE IDENTIFICACIÓN */}
            {data.customerStatus === 'existing' && data.confidence === 'high' && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-left">
                    <p className="font-semibold text-blue-800 mb-2">
                      ¡Te reconocemos! 👋
                    </p>
                    <p className="text-blue-700 mb-3">
                      Encontramos tu perfil en nuestro sistema. Esta solicitud se agregará a tu historial.
                    </p>
                    {data.existingPets?.length > 0 && (
                      <div className="bg-blue-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 mb-1 flex items-center">
                          <Pet className="h-4 w-4 mr-2" />
                          Tus mascotas registradas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.existingPets.map((pet: any) => (
                            <span key={pet.id} className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {pet.name} ({pet.species})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 🔐 PROMPT PARA LOGIN */}
            {data.hasAccount && data.loginPrompt && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-left">
                      <p className="font-semibold text-green-800">
                        {data.loginPrompt.message}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Accede a tu historial, mascotas y citas anteriores
                      </p>
                    </div>
                    <Link href={data.loginPrompt.loginUrl}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                        Iniciar Sesión
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* ⚠️ CLIENTE NECESITA REVISIÓN */}
            {data.customerStatus === 'needs_review' && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-left">
                    <p className="font-semibold text-orange-800 mb-2">
                      Información recibida ✓
                    </p>
                    <p className="text-orange-700 text-sm">
                      Hemos encontrado información similar en nuestro sistema. 
                      Nuestro equipo revisará y consolidará tu información para brindarte un mejor servicio.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 📋 RESUMEN DE LA SOLICITUD */}
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-[#75a99c]" />
                Detalles de tu solicitud:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Cliente:</strong> {formData.customerName}</p>
                  <p><strong>Teléfono:</strong> {formData.customerPhone}</p>
                  {formData.customerEmail && (
                    <p><strong>Email:</strong> {formData.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p><strong>Mascota:</strong> {formData.petName}</p>
                  {formData.service && <p><strong>Servicio:</strong> {formData.service}</p>}
                  {formData.preferredDate && (
                    <p><strong>Fecha preferida:</strong> {new Date(formData.preferredDate).toLocaleDateString()}</p>
                  )}
                  {formData.preferredTime && (
                    <p><strong>Hora preferida:</strong> {formData.preferredTime}</p>
                  )}
                </div>
              </div>
              {formData.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm"><strong>Notas:</strong> {formData.notes}</p>
                </div>
              )}
            </div>

            {/* 📞 INFORMACIÓN DE CONTACTO */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                ¿Tienes alguna pregunta? No dudes en contactarnos:
              </p>
              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <Button variant="outline" className="mr-4">
                    <Phone className="h-4 w-4 mr-2" />
                    {tenant.publicPhone}
                  </Button>
                </a>
              )}
              <Link href={`/${tenant.slug}`}>
                <Button variant="outline">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ❌ MOSTRAR ERROR
  if (submissionResult?.error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Error al enviar solicitud
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {submissionResult.error}
            </p>
            <Button 
              onClick={() => setSubmissionResult(null)}
              className="bg-[#75a99c] hover:bg-[#5b9788]"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // 📝 FORMULARIO ORIGINAL
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Agenda tu Cita
          </h2>
          <p className="text-lg text-gray-600">
            Completa el formulario y nos contactaremos contigo para confirmar tu cita
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-[#75a99c]" />
                Información de Contacto
              </h3>
              
              <div>
                <Label htmlFor="customerName">Nombre completo *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Teléfono *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  required
                  placeholder="Tu número de teléfono"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email (opcional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nos ayuda a identificarte si ya eres cliente
                </p>
              </div>
            </div>

            {/* Información de la cita */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Pet className="h-5 w-5 mr-2 text-[#75a99c]" />
                Detalles de la Cita
              </h3>
              
              <div>
                <Label htmlFor="petName">Nombre de la mascota *</Label>
                <Input
                  id="petName"
                  value={formData.petName}
                  onChange={(e) => setFormData({...formData, petName: e.target.value})}
                  required
                  placeholder="Nombre de tu mascota"
                />
              </div>
              
              <div>
                <Label htmlFor="service">Tipo de servicio</Label>
                <Select onValueChange={(value) => setFormData({...formData, service: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta General</SelectItem>
                    <SelectItem value="vacunacion">Vacunación</SelectItem>
                    <SelectItem value="cirugia">Cirugía</SelectItem>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                    <SelectItem value="revision">Revisión</SelectItem>
                    <SelectItem value="grooming">Peluquería</SelectItem>
                    <SelectItem value="dental">Limpieza Dental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Fecha preferida</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="preferredTime">Hora preferida</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe el motivo de la consulta o cualquier información adicional que consideres importante..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-[#75a99c] hover:bg-[#5b9788]"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando solicitud...' : 'Solicitar Cita'}
          </Button>
        </form>
      </div>
    </section>
  );
}
```.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Describe el motivo de la consulta o cualquier información adicional..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-[#75a99c] hover:bg-[#5b9788]"
          >
            Solicitar Cita
          </Button>
        </form>
      </div>
    </section>
  );
}
```

## Fase 4: API Routes con Identificación Inteligente

### 4.1 API Principal para Solicitudes de Cita
**Archivo:** `src/app/api/public/appointments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { findOrCreateCustomer, createPublicAppointmentRequest } from '@/lib/customer-identification';
import { sendAppointmentNotification } from '@/lib/notifications';
import { z } from 'zod';

const appointmentRequestSchema = z.object({
  tenantSlug: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional(),
  petName: z.string().min(1),
  service: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = appointmentRequestSchema.parse(body);

    const tenant = await getTenantBySlug(validatedData.tenantSlug);
    
    if (!tenant || !tenant.publicBookingEnabled) {
      return NextResponse.json(
        { error: 'Booking not available for this clinic' },
        { status: 404 }
      );
    }

    // 🔍 IDENTIFICACIÓN INTELIGENTE DE CLIENTE
    const identificationResult = await findOrCreateCustomer({
      tenantId: tenant.id,
      phone: validatedData.customerPhone,
      email: validatedData.customerEmail,
      name: validatedData.customerName
    });

    // 📅 CREAR SOLICITUD DE CITA
    const appointmentRequest = await createPublicAppointmentRequest({
      tenantId: tenant.id,
      customerId: identificationResult.customer.id,
      appointmentData: {
        petName: validatedData.petName,
        service: validatedData.service,
        preferredDate: validatedData.preferredDate,
        preferredTime: validatedData.preferredTime,
        notes: validatedData.notes
      },
      identificationResult
    });

    // 📧 ENVIAR NOTIFICACIONES
    await sendAppointmentNotification({
      tenant,
      appointmentRequest,
      customer: identificationResult.customer,
      identificationStatus: identificationResult.status
    });

    // 📊 RESPUESTA CON INFORMACIÓN DE IDENTIFICACIÓN
    return NextResponse.json({
      success: true,
      message: 'Appointment request created successfully',
      data: {
        appointmentRequest: {
          id: appointmentRequest.id,
          petName: appointmentRequest.petName,
          service: appointmentRequest.service,
          preferredDate: appointmentRequest.preferredDate,
          status: appointmentRequest.status
        },
        customerStatus: identificationResult.status,
        existingPets: identificationResult.existingPets || [],
        hasAccount: identificationResult.hasUserAccount,
        confidence: identificationResult.confidence,
        loginPrompt: identificationResult.hasUserAccount ? {
          message: "¡Te reconocemos! Inicia sesión para ver tu historial completo",
          loginUrl: `/sign-in?redirect=dashboard${identificationResult.customer.email ? `&email=${identificationResult.customer.email}` : ''}`
        } : null,
        similarCustomers: identificationResult.status === 'needs_review' 
          ? identificationResult.similarCustomers?.slice(0, 2) 
          : null
      }
    });

  } catch (error) {
    console.error('Error creating appointment request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 API para Gestión de Duplicados (Admin)
**Archivo:** `src/app/api/admin/customers/duplicates/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Obtener clientes que necesitan revisión
    const customersNeedingReview = await prisma.customer.findMany({
      where: {
        tenantId,
        needsReview: true,
        reviewedAt: null
      },
      include: {
        pets: true,
        appointmentRequests: {
          where: { identificationStatus: 'needs_review' },
          include: {
            customer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Para cada cliente, obtener los similares
    const reviewData = await Promise.all(
      customersNeedingReview.map(async (customer) => {
        const appointmentRequest = customer.appointmentRequests[0];
        const similarCustomerIds = appointmentRequest?.similarCustomerIds || [];
        
        const similarCustomers = await prisma.customer.findMany({
          where: {
            id: { in: similarCustomerIds }
          },
          include: {
            pets: true,
            appointmentRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        return {
          ...customer,
          similarCustomers,
          latestRequest: appointmentRequest
        };
      })
    );

    return NextResponse.json(reviewData);

  } catch (error) {
    console.error('Error fetching duplicate reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 API para Fusionar Clientes
**Archivo:** `src/app/api/admin/customers/merge/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { primaryId, duplicateId } = await request.json();

    if (!primaryId || !duplicateId) {
      return NextResponse.json(
        { error: 'Primary ID and Duplicate ID required' },
        { status: 400 }
      );
    }

    // Fusionar clientes en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Obtener ambos clientes
      const [primaryCustomer, duplicateCustomer] = await Promise.all([
        tx.customer.findUnique({ where: { id: primaryId }, include: { pets: true } }),
        tx.customer.findUnique({ where: { id: duplicateId }, include: { pets: true } })
      ]);

      if (!primaryCustomer || !duplicateCustomer) {
        throw new Error('Customer not found');
      }

      // 2. Actualizar relaciones del cliente duplicado al principal
      await Promise.all([
        // Transferir mascotas
        tx.pet.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }),
        // Transferir citas
        tx.appointment.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }),
        // Transferir solicitudes de citas
        tx.appointmentRequest.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        })
      ]);

      // 3. Actualizar información del cliente principal (merge de datos)
      const mergedData: any = {
        email: primaryCustomer.email || duplicateCustomer.email,
        phone: primaryCustomer.phone || duplicateCustomer.phone,
        address: primaryCustomer.address || duplicateCustomer.address,
        mergedFrom: [...(primaryCustomer.mergedFrom || []), duplicateId],
        needsReview: false,
        reviewedAt: new Date(),
        reviewedBy: user.id
      };

      await tx.customer.update({
        where: { id: primaryId },
        data: mergedData
      });

      // 4. Eliminar cliente duplicado
      await tx.customer.delete({
        where: { id: duplicateId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Customers merged successfully'
    });

  } catch (error) {
    console.error('Error merging customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```Name: z.string().min(1),
  service: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = appointmentRequestSchema.parse(body);

    const tenant = await getTenantBySlug(validatedData.tenantSlug);
    
    if (!tenant || !tenant.publicBookingEnabled) {
      return NextResponse.json(
        { error: 'Booking not available for this clinic' },
        { status: 404 }
      );
    }

    const result = await createPublicAppointmentRequest({
      tenantId: tenant.id,
      customerData: {
        name: validatedData.customerName,
        phone: validatedData.customerPhone,
        email: validatedData.customerEmail
      },
      appointmentData: {
        petName: validatedData.petName,
        service: validatedData.service,
        preferredDate: validatedData.preferredDate,
        preferredTime: validatedData.preferredTime,
        notes: validatedData.notes
      }
    });

    // Aquí puedes agregar notificaciones (email, WhatsApp, etc.)
    
    return NextResponse.json({
      success: true,
      message: 'Appointment request created successfully',
      data: result
    });

  } catch (error) {
    console.error('Error creating appointment request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Fase 6: Implementación por Pasos

### Paso 1: Base de Datos
```bash
# 1. Actualizar schema.prisma con los nuevos campos
# 2. Crear migración
npx prisma migrate dev --name add_public_page_and_appointment_request

# 3. Generar cliente
npx prisma generate
```

### Paso 2: Crear Estructura de Carpetas
```bash
mkdir -p src/app/\[clinicSlug\]
mkdir -p src/app/\[clinicSlug\]/agendar
mkdir -p src/components/public
mkdir -p src/app/api/public/appointments
```

### Paso 3: Implementar Componentes
1. Crear `layout.tsx` en `[clinicSlug]`
2. Crear `page.tsx` principal
3. Crear componentes en `/components/public/`
4. Crear API route para solicitudes

### Paso 4: Configuración de Tenant
Agregar función en el panel de administración para:
- Habilitar página pública
- Configurar información pública
- Subir imágenes
- Configurar servicios destacados

### Paso 5: Testing
1. Crear tenant de prueba con slug
2. Habilitar página pública
3. Probar URL: `localhost:3000/clinica-test`
4. Probar formulario de agendamiento

## Referencias de Código Base

**Basándote en tu OnboardingForm:**
- Reutilizar el patrón de validación de slug
- Usar el mismo estilo de formularios
- Mantener consistencia con tus componentes UI

**Integración con Sistema Existente:**
- Las solicitudes se mostrarán en el dashboard de la clínica
- Los clientes creados se integran con tu sistema de CRM
- Mantiene la estructura de tenants existente

Este plan te permitirá crear páginas públicas completamente funcionales manteniendo la arquitectura de tu sistema actual.