const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleServices = [
  // Consultas
  {
    name: 'Consulta General',
    description: 'Consulta médica general para revisión de rutina',
    category: 'CONSULTATION',
    price: 300,
    duration: 30
  },
  {
    name: 'Consulta de Emergencia',
    description: 'Atención médica urgente fuera de horario regular',
    category: 'EMERGENCY_CARE',
    price: 800,
    duration: 45
  },
  {
    name: 'Consulta Especializada',
    description: 'Consulta con especialista en cardiología, dermatología, etc.',
    category: 'CONSULTATION',
    price: 500,
    duration: 45
  },

  // Cirugías
  {
    name: 'Esterilización - Hembra',
    description: 'Ovariohisterectomía (castración de hembra)',
    category: 'SURGERY',
    price: 1500,
    duration: 120
  },
  {
    name: 'Esterilización - Macho',
    description: 'Orquiectomía (castración de macho)',
    category: 'SURGERY',
    price: 1200,
    duration: 60
  },
  {
    name: 'Cirugía de Hernia',
    description: 'Corrección quirúrgica de hernias',
    category: 'SURGERY',
    price: 2000,
    duration: 90
  },

  // Vacunación
  {
    name: 'Vacuna Triple Viral',
    description: 'Vacuna contra distemper, hepatitis y parvovirus',
    category: 'VACCINATION',
    price: 200,
    duration: 15
  },
  {
    name: 'Vacuna Antirrábica',
    description: 'Vacuna contra la rabia',
    category: 'VACCINATION',
    price: 150,
    duration: 15
  },
  {
    name: 'Vacuna Sextuple',
    description: 'Vacuna multivalente para cachorros',
    category: 'VACCINATION',
    price: 250,
    duration: 15
  },

  // Desparasitación
  {
    name: 'Desparasitación Interna',
    description: 'Tratamiento contra parásitos intestinales',
    category: 'DEWORMING',
    price: 80,
    duration: 10
  },
  {
    name: 'Desparasitación Externa',
    description: 'Tratamiento contra pulgas y garrapatas',
    category: 'DEWORMING',
    price: 100,
    duration: 15
  },

  // Análisis de Laboratorio
  {
    name: 'Hemograma Completo',
    description: 'Análisis completo de sangre',
    category: 'LABORATORY_TEST',
    price: 400,
    duration: 60
  },
  {
    name: 'Química Sanguínea',
    description: 'Perfil bioquímico de 12 parámetros',
    category: 'LABORATORY_TEST',
    price: 350,
    duration: 60
  },
  {
    name: 'Examen de Orina',
    description: 'Análisis completo de orina',
    category: 'LABORATORY_TEST',
    price: 200,
    duration: 30
  },

  // Radiografías e Imágenes
  {
    name: 'Radiografía Simple',
    description: 'Radiografía de una proyección',
    category: 'IMAGING_RADIOLOGY',
    price: 300,
    duration: 20
  },
  {
    name: 'Radiografía de Tórax',
    description: 'Radiografía completa del tórax (2 proyecciones)',
    category: 'IMAGING_RADIOLOGY',
    price: 400,
    duration: 25
  },
  {
    name: 'Ultrasonido Abdominal',
    description: 'Ecografía abdominal completa',
    category: 'IMAGING_RADIOLOGY',
    price: 600,
    duration: 45
  },

  // Cuidado Dental
  {
    name: 'Limpieza Dental',
    description: 'Profilaxis dental con ultrasonido',
    category: 'DENTAL_CARE',
    price: 800,
    duration: 90
  },
  {
    name: 'Extracción Dental Simple',
    description: 'Extracción de pieza dental sin complicaciones',
    category: 'DENTAL_CARE',
    price: 400,
    duration: 45
  },

  // Estética y Aseo
  {
    name: 'Baño Medicado',
    description: 'Baño con shampoo medicado para problemas de piel',
    category: 'GROOMING',
    price: 250,
    duration: 60
  },
  {
    name: 'Corte de Uñas',
    description: 'Corte y limado de uñas',
    category: 'GROOMING',
    price: 50,
    duration: 15
  },

  // Hospitalización
  {
    name: 'Hospitalización Diaria',
    description: 'Cuidado hospitalario por día',
    category: 'HOSPITALIZATION',
    price: 300,
    duration: 1440 // 24 horas en minutos
  }
];

async function seedServices() {
  try {
    console.log('🌱 Iniciando seed de servicios...');
    
    // Obtener todos los tenants activos
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' }
    });

    if (tenants.length === 0) {
      console.log('⚠️  No se encontraron tenants activos');
      return;
    }

    for (const tenant of tenants) {
      console.log(`📋 Creando servicios para tenant: ${tenant.name}`);
      
      // Verificar si ya existen servicios para este tenant
      const existingServices = await prisma.service.count({
        where: { tenantId: tenant.id }
      });

      if (existingServices > 0) {
        console.log(`   ⏭️  Ya existen ${existingServices} servicios, omitiendo...`);
        continue;
      }

      // Crear servicios para este tenant
      const createdServices = [];
      for (const serviceData of sampleServices) {
        const service = await prisma.service.create({
          data: {
            ...serviceData,
            tenantId: tenant.id,
            isActive: true
          }
        });
        createdServices.push(service);
      }

      console.log(`   ✅ Creados ${createdServices.length} servicios`);
    }

    console.log('🎉 Seed de servicios completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
  seedServices()
    .then(() => {
      console.log('✨ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedServices, sampleServices }; 