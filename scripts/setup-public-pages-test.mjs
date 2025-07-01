#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPublicPagesTest() {
  try {
    console.log('🚀 Configurando páginas públicas para testing...\n');

    // Buscar un tenant existente o crear uno de prueba
    let tenant = await prisma.tenant.findFirst({
      where: {
        status: 'ACTIVE'
      }
    });

    if (!tenant) {
      console.log('❌ No se encontró ningún tenant activo');
      console.log('💡 Crea un tenant desde el dashboard primero');
      return;
    }

    console.log(`📋 Tenant encontrado: ${tenant.name} (${tenant.slug})`);

    // Actualizar el tenant con configuración pública
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        publicPageEnabled: true,
        publicBookingEnabled: true,
        publicDescription: 'Clínica veterinaria especializada en el cuidado integral de tus mascotas. Ofrecemos servicios de consulta general, vacunación, cirugía y emergencias las 24 horas.',
        publicPhone: '+1 (555) 123-4567',
        publicEmail: 'info@' + tenant.slug + '.com',
        publicAddress: 'Calle Principal 123, Ciudad, Estado 12345',
        publicThemeColor: '#75a99c',
        publicHours: {
          weekdays: 'Lun-Vie: 8:00 - 18:00',
          saturday: 'Sáb: 9:00 - 14:00',
          sunday: 'Dom: Emergencias'
        },
        publicServices: [
          'Consulta General',
          'Vacunación',
          'Cirugía',
          'Emergencias 24h',
          'Peluquería Canina',
          'Hospitalización'
        ],
        publicSocialMedia: {
          facebook: 'https://facebook.com/' + tenant.slug,
          instagram: 'https://instagram.com/' + tenant.slug,
          whatsapp: '+1555123456'
        }
      }
    });

    console.log('✅ Páginas públicas configuradas exitosamente!\n');
    console.log('🌐 URLs disponibles:');
    console.log(`   • Página principal: http://localhost:3000/${tenant.slug}`);
    console.log(`   • Agendar cita:    http://localhost:3000/${tenant.slug}/agendar`);
    console.log(`   • Servicios:       http://localhost:3000/${tenant.slug}/servicios`);
    
    console.log('\n📝 Configuración aplicada:');
    console.log(`   • Páginas públicas:     ✅ Habilitadas`);
    console.log(`   • Booking público:      ✅ Habilitado`);
    console.log(`   • Descripción:          ✅ Configurada`);
    console.log(`   • Información contacto: ✅ Configurada`);
    console.log(`   • Tema de color:        ✅ ${updatedTenant.publicThemeColor}`);
    
    console.log('\n🧪 Para testing:');
    console.log('1. Visita la URL principal');
    console.log('2. Prueba el formulario de agendamiento');
    console.log('3. Verifica la identificación inteligente con diferentes datos');
    console.log('4. Revisa las solicitudes en el dashboard');

  } catch (error) {
    console.error('❌ Error configurando páginas públicas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPublicPagesTest(); 