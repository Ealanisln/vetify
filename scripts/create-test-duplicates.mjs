#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestDuplicates() {
  try {
    console.log('🧪 Creando clientes duplicados para testing...\n');

    // Buscar un tenant activo
    const tenant = await prisma.tenant.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!tenant) {
      console.log('❌ No se encontró ningún tenant activo');
      return;
    }

    console.log(`📋 Usando tenant: ${tenant.name} (${tenant.slug})\n`);

    // Crear cliente principal
    const primaryCustomer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'María García',
        phone: '+52 555 123 4567',
        email: 'maria.garcia@email.com',
        address: 'Calle Principal 123, Ciudad, México',
        source: 'MANUAL'
      }
    });

    console.log(`✅ Cliente principal creado: ${primaryCustomer.name}`);

    // Crear mascotas para el cliente principal
    await prisma.pet.createMany({
      data: [
        {
          tenantId: tenant.id,
          customerId: primaryCustomer.id,
          name: 'Max',
          species: 'Perro',
          breed: 'Golden Retriever',
          birthDate: new Date('2020-05-15'),
          gender: 'MALE'
        },
        {
          tenantId: tenant.id,
          customerId: primaryCustomer.id,
          name: 'Luna',
          species: 'Gato',
          breed: 'Siamés',
          birthDate: new Date('2021-03-10'),
          gender: 'FEMALE'
        }
      ]
    });

    // Crear cliente duplicado 1 (nombre ligeramente diferente)
    const duplicateCustomer1 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Maria Garcia',  // Sin acento
        phone: '+52 555 987 6543',  // Teléfono diferente
        email: 'mari.garcia@gmail.com',  // Email diferente
        source: 'PUBLIC_BOOKING',
        needsReview: true
      }
    });

    console.log(`⚠️  Cliente duplicado 1 creado: ${duplicateCustomer1.name}`);

    // Crear solicitud de cita para el duplicado 1
    await prisma.appointmentRequest.create({
      data: {
        tenantId: tenant.id,
        customerId: duplicateCustomer1.id,
        petName: 'Maximiliano',  // Nombre de mascota similar
        service: 'Consulta General',
        preferredDate: new Date(),
        notes: 'Mi perro necesita revisión general',
        status: 'PENDING',
        source: 'PUBLIC_BOOKING',
        identificationStatus: 'needs_review',
        similarCustomerIds: [primaryCustomer.id]
      }
    });

    // Crear cliente duplicado 2 (teléfono similar)
    const duplicateCustomer2 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'María Elena García',  // Nombre más largo pero similar
        phone: '+52 555 123 4567',  // Mismo teléfono que el principal
        source: 'PUBLIC_BOOKING',
        needsReview: true
      }
    });

    console.log(`⚠️  Cliente duplicado 2 creado: ${duplicateCustomer2.name}`);

    // Crear solicitud de cita para el duplicado 2
    await prisma.appointmentRequest.create({
      data: {
        tenantId: tenant.id,
        customerId: duplicateCustomer2.id,
        petName: 'Lulu',  // Nombre de mascota similar a Luna
        service: 'Vacunación',
        preferredDate: new Date(),
        notes: 'Necesito vacunar a mi gata',
        status: 'PENDING',
        source: 'PUBLIC_BOOKING',
        identificationStatus: 'needs_review',
        similarCustomerIds: [primaryCustomer.id]
      }
    });

    // Crear cliente duplicado 3 (email similar)
    const duplicateCustomer3 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'María García López',
        phone: '+52 555 111 2222',
        email: 'maria.garcia@gmail.com',  // Email muy similar
        source: 'PUBLIC_BOOKING',
        needsReview: true
      }
    });

    console.log(`⚠️  Cliente duplicado 3 creado: ${duplicateCustomer3.name}`);

    // Crear solicitud de cita para el duplicado 3
    await prisma.appointmentRequest.create({
      data: {
        tenantId: tenant.id,
        customerId: duplicateCustomer3.id,
        petName: 'Rex',
        service: 'Emergencia',
        preferredDate: new Date(),
        notes: 'Mi perro se lastimó una pata',
        status: 'PENDING',
        source: 'PUBLIC_BOOKING',
        identificationStatus: 'needs_review',
        similarCustomerIds: [primaryCustomer.id]
      }
    });

    // Crear un cliente completamente diferente (control)
    const uniqueCustomer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Juan Carlos Pérez',
        phone: '+52 555 999 8888',
        email: 'juan.perez@correo.com',
        address: 'Avenida Reforma 456, CDMX',
        source: 'MANUAL'
      }
    });

    console.log(`✅ Cliente único creado: ${uniqueCustomer.name}`);

    // Crear mascota para el cliente único
    await prisma.pet.create({
      data: {
        tenantId: tenant.id,
        customerId: uniqueCustomer.id,
        name: 'Bobby',
        species: 'Perro',
        breed: 'Poodle',
        birthDate: new Date('2019-08-20'),
        gender: 'MALE'
      }
    });

    console.log('\n🎯 Resumen de datos de prueba creados:');
    console.log(`   • 1 Cliente principal: ${primaryCustomer.name} (2 mascotas)`);
    console.log(`   • 3 Clientes duplicados que necesitan revisión`);
    console.log(`   • 1 Cliente único (control)`);
    console.log(`   • 3 Solicitudes de cita pendientes`);

    console.log('\n🔗 URLs para probar:');
    console.log(`   • Dashboard: http://localhost:3000/dashboard`);
    console.log(`   • API duplicados: http://localhost:3000/api/admin/customers/duplicates`);
    console.log(`   • Página pública: http://localhost:3000/${tenant.slug}`);

    console.log('\n🧪 Casos de prueba sugeridos:');
    console.log('1. Usar el componente DuplicateCustomersManager en el dashboard');
    console.log('2. Marcar un cliente como "no duplicado"');
    console.log('3. Fusionar dos clientes duplicados');
    console.log('4. Probar el formulario público con datos similares');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDuplicates(); 