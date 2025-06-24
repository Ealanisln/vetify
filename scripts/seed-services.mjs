import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

// Servicios de muestra para clínicas veterinarias
const sampleServices = [
  // CONSULTATION
  { 
    name: 'Consulta General', 
    category: 'CONSULTATION', 
    price: 450, 
    duration: 30,
    description: 'Consulta médica general con revisión física completa'
  },
  { 
    name: 'Consulta de Emergencia', 
    category: 'CONSULTATION', 
    price: 800, 
    duration: 45,
    description: 'Atención médica de urgencia 24 horas'
  },
  { 
    name: 'Consulta Especializada', 
    category: 'CONSULTATION', 
    price: 650, 
    duration: 60,
    description: 'Consulta con veterinario especialista'
  },

  // VACCINATION
  { 
    name: 'Vacuna Triple Viral', 
    category: 'VACCINATION', 
    price: 280, 
    duration: 15,
    description: 'Vacuna contra moquillo, hepatitis y parvovirus'
  },
  { 
    name: 'Vacuna Antirrábica', 
    category: 'VACCINATION', 
    price: 200, 
    duration: 15,
    description: 'Vacuna obligatoria contra la rabia'
  },
  { 
    name: 'Vacuna Múltiple', 
    category: 'VACCINATION', 
    price: 350, 
    duration: 20,
    description: 'Vacuna pentavalente para perros'
  },

  // SURGERY
  { 
    name: 'Esterilización Hembra', 
    category: 'SURGERY', 
    price: 1800, 
    duration: 120,
    description: 'Ovariohisterectomía completa'
  },
  { 
    name: 'Castración Macho', 
    category: 'SURGERY', 
    price: 1200, 
    duration: 60,
    description: 'Orquiectomía bajo anestesia general'
  },
  { 
    name: 'Cirugía de Hernia', 
    category: 'SURGERY', 
    price: 2500, 
    duration: 90,
    description: 'Corrección quirúrgica de hernias'
  },

  // DEWORMING
  { 
    name: 'Desparasitación Interna', 
    category: 'DEWORMING', 
    price: 150, 
    duration: 10,
    description: 'Tratamiento contra parásitos intestinales'
  },
  { 
    name: 'Desparasitación Externa', 
    category: 'DEWORMING', 
    price: 180, 
    duration: 15,
    description: 'Tratamiento contra pulgas y garrapatas'
  },

  // LABORATORY_TEST
  { 
    name: 'Hemograma Completo', 
    category: 'LABORATORY_TEST', 
    price: 420, 
    duration: 30,
    description: 'Análisis completo de sangre'
  },
  { 
    name: 'Química Sanguínea', 
    category: 'LABORATORY_TEST', 
    price: 380, 
    duration: 30,
    description: 'Perfil bioquímico completo'
  },
  { 
    name: 'Urianálisis', 
    category: 'LABORATORY_TEST', 
    price: 250, 
    duration: 20,
    description: 'Análisis completo de orina'
  },

  // IMAGING_RADIOLOGY
  { 
    name: 'Radiografía Simple', 
    category: 'IMAGING_RADIOLOGY', 
    price: 550, 
    duration: 30,
    description: 'Radiografía digital de una región'
  },
  { 
    name: 'Ultrasonido Abdominal', 
    category: 'IMAGING_RADIOLOGY', 
    price: 750, 
    duration: 45,
    description: 'Ecografía abdominal completa'
  },

  // DENTAL_CARE
  { 
    name: 'Limpieza Dental', 
    category: 'DENTAL_CARE', 
    price: 850, 
    duration: 60,
    description: 'Profilaxis dental con ultrasonido'
  },
  { 
    name: 'Extracción Dental', 
    category: 'DENTAL_CARE', 
    price: 400, 
    duration: 30,
    description: 'Extracción de piezas dentales'
  },

  // GROOMING
  { 
    name: 'Baño Medicado', 
    category: 'GROOMING', 
    price: 250, 
    duration: 45,
    description: 'Baño terapéutico con shampoo medicado'
  },
  { 
    name: 'Corte de Uñas', 
    category: 'GROOMING', 
    price: 80, 
    duration: 15,
    description: 'Recorte de uñas profesional'
  },

  // HOSPITALIZATION
  { 
    name: 'Hospitalización por Día', 
    category: 'HOSPITALIZATION', 
    price: 400, 
    duration: 1440, // 24 horas en minutos
    description: 'Internación con cuidados médicos 24 horas'
  },

  // EMERGENCY_CARE
  { 
    name: 'Atención de Emergencia', 
    category: 'EMERGENCY_CARE', 
    price: 1200, 
    duration: 60,
    description: 'Atención médica de urgencia'
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
      console.log('❌ No se encontraron tenants activos.');
      return;
    }

    // Crear servicios para cada tenant
    for (const tenant of tenants) {
      console.log(`📋 Creando servicios para tenant: ${tenant.name}`);

      // Verificar si ya tiene servicios
      const existingServices = await prisma.service.count({
        where: { tenantId: tenant.id }
      });

      if (existingServices > 0) {
        console.log(`⏭️  Tenant ${tenant.name} ya tiene ${existingServices} servicios. Saltando...`);
        continue;
      }

      // Crear servicios para este tenant
      for (const service of sampleServices) {
        await prisma.service.create({
          data: {
            ...service,
            tenantId: tenant.id
          }
        });
      }

      console.log(`✅ Creados ${sampleServices.length} servicios para ${tenant.name}`);
    }

    console.log('🎉 Seed de servicios completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed de servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedServices(); 