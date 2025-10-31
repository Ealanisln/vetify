/**
 * Script de seed para generar datos de prueba usando Faker
 *
 * Uso: pnpm tsx scripts/seed-test-data.ts <email-del-usuario>
 * Ejemplo: pnpm tsx scripts/seed-test-data.ts xp3ctr0@gmail.com
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configurar faker para español de México
faker.locale = 'es_MX';

interface SeedStats {
  customers: number;
  pets: number;
  appointments: number;
  inventoryItems: number;
  inventoryMovements: number;
  medicalHistories: number;
  treatmentRecords: number;
  services: number;
  staff: number;
  reminders: number;
  errors: string[];
}

const stats: SeedStats = {
  customers: 0,
  pets: 0,
  appointments: 0,
  inventoryItems: 0,
  inventoryMovements: 0,
  medicalHistories: 0,
  treatmentRecords: 0,
  services: 0,
  staff: 0,
  reminders: 0,
  errors: [],
};

// Datos específicos para veterinarias
const dogBreeds = [
  'Labrador Retriever', 'Pastor Alemán', 'Golden Retriever', 'Bulldog Francés',
  'Beagle', 'Poodle', 'Chihuahua', 'Yorkshire Terrier', 'Boxer', 'Dachshund',
  'Schnauzer', 'Cocker Spaniel', 'Border Collie', 'Husky Siberiano', 'Pug',
  'Shih Tzu', 'Boston Terrier', 'Doberman', 'Maltés', 'Mestizo'
];

const catBreeds = [
  'Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Sphynx', 'Ragdoll',
  'British Shorthair', 'Abisinio', 'Scottish Fold', 'Común Europeo',
  'Angora', 'Birmano', 'Devon Rex', 'Mestizo'
];

const petNames = [
  'Max', 'Luna', 'Charlie', 'Bella', 'Rocky', 'Coco', 'Thor', 'Lola',
  'Simba', 'Nina', 'Zeus', 'Mia', 'Toby', 'Princesa', 'Buddy', 'Canela',
  'Duke', 'Nala', 'Cooper', 'Pelusa', 'Bruno', 'Chispa', 'Jack', 'Maya'
];

const appointmentReasons = [
  'Consulta general',
  'Vacunación',
  'Control de rutina',
  'Revisión de piel',
  'Problemas digestivos',
  'Cirugía programada',
  'Emergencia',
  'Esterilización/Castración',
  'Limpieza dental',
  'Control de peso',
  'Análisis de laboratorio',
  'Revisión post-operatoria',
];

const medicineCategories = [
  { name: 'Amoxicilina', category: 'MEDICINE', activeCompound: 'Amoxicilina', presentation: 'Comprimidos', measure: '500mg' },
  { name: 'Meloxicam', category: 'MEDICINE', activeCompound: 'Meloxicam', presentation: 'Suspensión oral', measure: '1.5mg/ml' },
  { name: 'Dexametasona', category: 'MEDICINE', activeCompound: 'Dexametasona', presentation: 'Inyectable', measure: '4mg/ml' },
  { name: 'Vacuna Quíntuple', category: 'VACCINE', activeCompound: 'Vacuna polivalente canina', presentation: 'Vial', measure: '1ml' },
  { name: 'Vacuna Antirrábica', category: 'VACCINE', activeCompound: 'Virus rábico inactivado', presentation: 'Vial', measure: '1ml' },
  { name: 'Praziquantel + Pirantel', category: 'DEWORMER', activeCompound: 'Praziquantel/Pirantel', presentation: 'Tabletas', measure: '50mg/144mg' },
  { name: 'Fenbendazol', category: 'DEWORMER', activeCompound: 'Fenbendazol', presentation: 'Suspensión', measure: '10%' },
  { name: 'Frontline Plus', category: 'FLEA_TICK_PREVENTION', activeCompound: 'Fipronil/S-Metopreno', presentation: 'Pipeta', measure: '0.67ml' },
  { name: 'NexGard', category: 'FLEA_TICK_PREVENTION', activeCompound: 'Afoxolaner', presentation: 'Tableta masticable', measure: '28.3mg' },
  { name: 'Alimento Premium Adulto', category: 'FOOD_REGULAR', activeCompound: 'N/A', presentation: 'Bolsa', measure: '15kg' },
  { name: 'Alimento Gastroentérico', category: 'FOOD_PRESCRIPTION', activeCompound: 'N/A', presentation: 'Bolsa', measure: '8kg' },
];

const servicesList = [
  { name: 'Consulta General', category: 'CONSULTATION', price: 300, duration: 30 },
  { name: 'Consulta Especializada', category: 'CONSULTATION', price: 500, duration: 45 },
  { name: 'Cirugía Menor', category: 'SURGERY', price: 2500, duration: 120 },
  { name: 'Cirugía Mayor', category: 'SURGERY', price: 5000, duration: 180 },
  { name: 'Esterilización Hembra', category: 'SURGERY', price: 1800, duration: 90 },
  { name: 'Castración Macho', category: 'SURGERY', price: 1200, duration: 60 },
  { name: 'Vacunación Quíntuple', category: 'VACCINATION', price: 350, duration: 15 },
  { name: 'Vacunación Antirrábica', category: 'VACCINATION', price: 250, duration: 15 },
  { name: 'Desparasitación', category: 'DEWORMING', price: 200, duration: 15 },
  { name: 'Limpieza Dental', category: 'DENTAL_CARE', price: 1500, duration: 90 },
  { name: 'Rayos X', category: 'IMAGING_RADIOLOGY', price: 800, duration: 30 },
  { name: 'Ultrasonido', category: 'IMAGING_RADIOLOGY', price: 1200, duration: 45 },
  { name: 'Análisis de Sangre Completo', category: 'LABORATORY_TEST', price: 600, duration: 30 },
  { name: 'Baño y Corte', category: 'GROOMING', price: 400, duration: 60 },
  { name: 'Hospitalización por día', category: 'HOSPITALIZATION', price: 800, duration: 1440 },
];

async function findTenantByUserEmail(email: string) {
  console.log(`🔍 Buscando tenant para el usuario: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenant: true,
    },
  });

  if (!user) {
    throw new Error(`❌ Usuario no encontrado: ${email}`);
  }

  if (!user.tenantId || !user.tenant) {
    throw new Error(`❌ Usuario ${email} no tiene un tenant asociado`);
  }

  console.log(`✅ Tenant encontrado: ${user.tenant.name} (${user.tenant.id})`);
  return user.tenant;
}

async function createCustomers(tenantId: string, count: number = 50) {
  console.log(`\n👥 Creando ${count} clientes...`);
  const customers = [];

  for (let i = 0; i < count; i++) {
    try {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      const customer = await prisma.customer.create({
        data: {
          tenantId,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number('55########'),
          address: faker.location.streetAddress(true),
          preferredContactMethod: faker.helpers.arrayElement(['phone', 'email', 'whatsapp']),
          source: 'MANUAL',
          isActive: true,
        },
      });

      customers.push(customer);
      stats.customers++;
    } catch (error) {
      stats.errors.push(`Error creando cliente ${i}: ${error}`);
    }
  }

  console.log(`✅ ${customers.length} clientes creados`);
  return customers;
}

async function createPetsForCustomers(tenantId: string, customers: any[], petsPerCustomer: number = 1) {
  console.log(`\n🐾 Creando mascotas (${petsPerCustomer} por cliente)...`);
  const pets = [];

  for (const customer of customers) {
    const numPets = faker.number.int({ min: 1, max: petsPerCustomer });

    for (let i = 0; i < numPets; i++) {
      try {
        const species = faker.helpers.arrayElement(['Canino', 'Felino']);
        const breed = species === 'Canino'
          ? faker.helpers.arrayElement(dogBreeds)
          : faker.helpers.arrayElement(catBreeds);

        const dateOfBirth = faker.date.past({ years: 15 });
        const weight = species === 'Canino'
          ? faker.number.float({ min: 5, max: 40, multipleOf: 0.1 })
          : faker.number.float({ min: 2, max: 8, multipleOf: 0.1 });

        const pet = await prisma.pet.create({
          data: {
            tenantId,
            customerId: customer.id,
            name: faker.helpers.arrayElement(petNames),
            species,
            breed,
            dateOfBirth,
            gender: faker.helpers.arrayElement(['male', 'female']),
            weight: new Prisma.Decimal(weight),
            weightUnit: 'kg',
            microchipNumber: faker.helpers.maybe(() => faker.string.numeric(15), { probability: 0.3 }),
            isNeutered: faker.datatype.boolean(0.4),
            isDeceased: false,
          },
        });

        pets.push(pet);
        stats.pets++;
      } catch (error) {
        stats.errors.push(`Error creando mascota para cliente ${customer.id}: ${error}`);
      }
    }
  }

  console.log(`✅ ${pets.length} mascotas creadas`);
  return pets;
}

async function createStaff(tenantId: string, count: number = 5) {
  console.log(`\n👨‍⚕️ Creando ${count} miembros del staff...`);
  const staff = [];

  const positions = ['Veterinario', 'Veterinario Especialista', 'Asistente Veterinario', 'Recepcionista', 'Groomer'];

  for (let i = 0; i < count; i++) {
    try {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const position = positions[i] || faker.helpers.arrayElement(positions);

      const staffMember = await prisma.staff.create({
        data: {
          tenantId,
          name: `${firstName} ${lastName}`,
          position,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number('55########'),
          licenseNumber: position.includes('Veterinario') ? faker.string.numeric(8) : null,
          isActive: true,
        },
      });

      staff.push(staffMember);
      stats.staff++;
    } catch (error) {
      stats.errors.push(`Error creando staff ${i}: ${error}`);
    }
  }

  console.log(`✅ ${staff.length} miembros del staff creados`);
  return staff;
}

async function createServices(tenantId: string) {
  console.log(`\n💼 Creando servicios...`);
  const services = [];

  for (const serviceData of servicesList) {
    try {
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: serviceData.name,
          category: serviceData.category as any,
          price: new Prisma.Decimal(serviceData.price),
          duration: serviceData.duration,
          isActive: true,
        },
      });

      services.push(service);
      stats.services++;
    } catch (error) {
      stats.errors.push(`Error creando servicio ${serviceData.name}: ${error}`);
    }
  }

  console.log(`✅ ${services.length} servicios creados`);
  return services;
}

async function createInventoryItems(tenantId: string) {
  console.log(`\n📦 Creando items de inventario...`);
  const items = [];

  for (const itemData of medicineCategories) {
    try {
      const quantity = faker.number.int({ min: 10, max: 100 });
      const cost = faker.number.float({ min: 50, max: 500, multipleOf: 0.01 });
      const price = cost * faker.number.float({ min: 1.3, max: 2.5, multipleOf: 0.01 });

      const item = await prisma.inventoryItem.create({
        data: {
          tenantId,
          name: itemData.name,
          category: itemData.category as any,
          activeCompound: itemData.activeCompound,
          presentation: itemData.presentation,
          measure: itemData.measure,
          brand: faker.company.name(),
          quantity: new Prisma.Decimal(quantity),
          minStock: new Prisma.Decimal(faker.number.int({ min: 5, max: 20 })),
          location: `Estante ${faker.string.alpha({ length: 1, casing: 'upper' })}-${faker.number.int({ min: 1, max: 20 })}`,
          expirationDate: faker.date.future({ years: 2 }),
          status: 'ACTIVE',
          batchNumber: faker.string.alphanumeric(8).toUpperCase(),
          cost: new Prisma.Decimal(cost),
          price: new Prisma.Decimal(price),
        },
      });

      items.push(item);
      stats.inventoryItems++;
    } catch (error) {
      stats.errors.push(`Error creando item de inventario ${itemData.name}: ${error}`);
    }
  }

  console.log(`✅ ${items.length} items de inventario creados`);
  return items;
}

async function createAppointments(tenantId: string, pets: any[], staff: any[], count: number = 100) {
  console.log(`\n📅 Creando ${count} citas...`);

  if (pets.length === 0 || staff.length === 0) {
    console.log('⚠️ Se necesitan mascotas y staff para crear citas');
    return [];
  }

  const appointments = [];

  for (let i = 0; i < count; i++) {
    try {
      const pet = faker.helpers.arrayElement(pets);
      const staffMember = faker.helpers.arrayElement(staff);
      const dateTime = faker.date.between({
        from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 días atrás
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)    // 30 días adelante
      });

      const isPast = dateTime < new Date();
      const status = isPast
        ? faker.helpers.arrayElement(['COMPLETED', 'CANCELLED_CLIENT', 'NO_SHOW'] as const)
        : faker.helpers.arrayElement(['SCHEDULED', 'CONFIRMED'] as const);

      const appointment = await prisma.appointment.create({
        data: {
          tenantId,
          petId: pet.id,
          customerId: pet.customerId,
          staffId: staffMember.id,
          dateTime,
          duration: faker.number.int({ min: 15, max: 120 }),
          reason: faker.helpers.arrayElement(appointmentReasons),
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
          status,
        },
      });

      appointments.push(appointment);
      stats.appointments++;
    } catch (error) {
      stats.errors.push(`Error creando cita ${i}: ${error}`);
    }
  }

  console.log(`✅ ${appointments.length} citas creadas`);
  return appointments;
}

async function createMedicalHistories(tenantId: string, pets: any[], staff: any[], count: number = 80) {
  console.log(`\n📋 Creando ${count} historiales médicos...`);

  if (pets.length === 0 || staff.length === 0) {
    console.log('⚠️ Se necesitan mascotas y staff para crear historiales médicos');
    return [];
  }

  const histories = [];
  const diagnoses = [
    'Gastroenteritis aguda',
    'Otitis externa',
    'Dermatitis alérgica',
    'Infección de vías urinarias',
    'Control de rutina',
    'Vacunación anual',
    'Parásitos intestinales',
    'Fractura de extremidad',
    'Conjuntivitis',
    'Enfermedad periodontal',
  ];

  const treatments = [
    'Antibióticos vía oral por 7 días',
    'Antiinflamatorios y reposo',
    'Cambio de alimentación y probióticos',
    'Limpieza de oídos y gotas tópicas',
    'Desparasitación',
    'Vacuna aplicada',
    'Cirugía programada',
    'Tratamiento tópico',
  ];

  for (let i = 0; i < count; i++) {
    try {
      const pet = faker.helpers.arrayElement(pets);
      const staffMember = faker.helpers.arrayElement(staff);

      const history = await prisma.medicalHistory.create({
        data: {
          tenantId,
          petId: pet.id,
          staffId: staffMember.id,
          visitDate: faker.date.past({ years: 2 }),
          reasonForVisit: faker.helpers.arrayElement(appointmentReasons),
          diagnosis: faker.helpers.arrayElement(diagnoses),
          treatment: faker.helpers.arrayElement(treatments),
          notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.3 }),
        },
      });

      histories.push(history);
      stats.medicalHistories++;
    } catch (error) {
      stats.errors.push(`Error creando historial médico ${i}: ${error}`);
    }
  }

  console.log(`✅ ${histories.length} historiales médicos creados`);
  return histories;
}

async function createTreatmentRecords(tenantId: string, pets: any[], staff: any[], count: number = 60) {
  console.log(`\n💉 Creando ${count} registros de tratamiento...`);

  if (pets.length === 0 || staff.length === 0) {
    console.log('⚠️ Se necesitan mascotas y staff para crear registros de tratamiento');
    return [];
  }

  const treatments = [];
  const vaccineNames = ['Quíntuple', 'Antirrábica', 'Bordetella', 'Leptospirosis', 'Triple Felina'];
  const dewormingNames = ['Drontal Plus', 'Panacur', 'Milbemax', 'Advocate'];

  for (let i = 0; i < count; i++) {
    try {
      const pet = faker.helpers.arrayElement(pets);
      const staffMember = faker.helpers.arrayElement(staff);
      const treatmentType = faker.helpers.arrayElement([
        'VACCINATION',
        'DEWORMING',
        'FLEA_TICK',
        'OTHER_PREVENTATIVE'
      ] as const);

      let productName = '';
      let vaccineStage = null;
      let dewormingType = null;

      if (treatmentType === 'VACCINATION') {
        productName = faker.helpers.arrayElement(vaccineNames);
        vaccineStage = faker.helpers.arrayElement(['PUPPY_KITTEN', 'ADULT', 'BOOSTER'] as const);
      } else if (treatmentType === 'DEWORMING') {
        productName = faker.helpers.arrayElement(dewormingNames);
        dewormingType = faker.helpers.arrayElement(['INTERNAL', 'EXTERNAL', 'BOTH'] as const);
      } else if (treatmentType === 'FLEA_TICK') {
        productName = faker.helpers.arrayElement(['Frontline', 'NexGard', 'Bravecto', 'Simparica']);
      } else {
        productName = faker.helpers.arrayElement(['Suplemento multivitamínico', 'Tratamiento piel', 'Probióticos']);
      }

      const treatment = await prisma.treatmentRecord.create({
        data: {
          tenantId,
          petId: pet.id,
          staffId: staffMember.id,
          treatmentType,
          productName,
          administrationDate: faker.date.past({ years: 1 }),
          batchNumber: faker.helpers.maybe(() => faker.string.alphanumeric(8).toUpperCase(), { probability: 0.7 }),
          manufacturer: faker.helpers.maybe(() => faker.company.name(), { probability: 0.5 }),
          vaccineStage,
          dewormingType,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
        },
      });

      treatments.push(treatment);
      stats.treatmentRecords++;
    } catch (error) {
      stats.errors.push(`Error creando registro de tratamiento ${i}: ${error}`);
    }
  }

  console.log(`✅ ${treatments.length} registros de tratamiento creados`);
  return treatments;
}

async function createReminders(tenantId: string, pets: any[], customers: any[], count: number = 40) {
  console.log(`\n🔔 Creando ${count} recordatorios...`);

  if (pets.length === 0) {
    console.log('⚠️ Se necesitan mascotas para crear recordatorios');
    return [];
  }

  const reminders = [];
  const reminderTypes = ['APPOINTMENT', 'TREATMENT', 'MEDICATION', 'CHECKUP'] as const;

  for (let i = 0; i < count; i++) {
    try {
      const pet = faker.helpers.arrayElement(pets);
      const customer = customers.find((c: any) => c.id === pet.customerId);
      const type = faker.helpers.arrayElement(reminderTypes);

      let title = '';
      let message = '';

      switch (type) {
        case 'APPOINTMENT':
          title = 'Recordatorio de cita';
          message = `Recordatorio de cita para ${pet.name}`;
          break;
        case 'TREATMENT':
          title = 'Próxima vacunación';
          message = `${pet.name} necesita su vacuna de refuerzo`;
          break;
        case 'MEDICATION':
          title = 'Medicación pendiente';
          message = `Recuerda administrar medicamento a ${pet.name}`;
          break;
        case 'CHECKUP':
          title = 'Revisión anual';
          message = `Es hora del chequeo anual de ${pet.name}`;
          break;
      }

      const dueDate = faker.date.soon({ days: 60 });
      const isPast = dueDate < new Date();

      const reminder = await prisma.reminder.create({
        data: {
          tenantId,
          petId: pet.id,
          customerId: customer?.id,
          type,
          title,
          message,
          dueDate,
          status: isPast
            ? faker.helpers.arrayElement(['SENT', 'DISMISSED'] as const)
            : 'PENDING',
          sentAt: isPast ? faker.date.recent({ days: 5 }) : null,
        },
      });

      reminders.push(reminder);
      stats.reminders++;
    } catch (error) {
      stats.errors.push(`Error creando recordatorio ${i}: ${error}`);
    }
  }

  console.log(`✅ ${reminders.length} recordatorios creados`);
  return reminders;
}

async function createInventoryMovements(tenantId: string, items: any[], staff: any[], count: number = 50) {
  console.log(`\n📊 Creando ${count} movimientos de inventario...`);

  if (items.length === 0) {
    console.log('⚠️ Se necesitan items de inventario para crear movimientos');
    return [];
  }

  const movements = [];

  for (let i = 0; i < count; i++) {
    try {
      const item = faker.helpers.arrayElement(items);
      const staffMember = staff.length > 0 ? faker.helpers.arrayElement(staff) : null;
      const movementType = faker.helpers.arrayElement([
        'PURCHASE_IN',
        'SALE_OUT',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
      ] as const);

      const quantity = faker.number.float({ min: 1, max: 20, multipleOf: 0.1 });

      const movement = await prisma.inventoryMovement.create({
        data: {
          tenantId,
          itemId: item.id,
          staffId: staffMember?.id,
          type: movementType,
          quantity: new Prisma.Decimal(quantity),
          date: faker.date.past({ years: 1 }),
          reason: movementType === 'PURCHASE_IN' ? 'Compra a proveedor' :
                  movementType === 'SALE_OUT' ? 'Venta a cliente' :
                  'Ajuste de inventario',
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        },
      });

      movements.push(movement);
      stats.inventoryMovements++;

      // Actualizar cantidad del item
      if (movementType.endsWith('_IN')) {
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });
      } else if (movementType.endsWith('_OUT')) {
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });
      }
    } catch (error) {
      stats.errors.push(`Error creando movimiento de inventario ${i}: ${error}`);
    }
  }

  console.log(`✅ ${movements.length} movimientos de inventario creados`);
  return movements;
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Debes proporcionar el email del usuario');
    console.log('Uso: pnpm tsx scripts/seed-test-data.ts <email>');
    console.log('Ejemplo: pnpm tsx scripts/seed-test-data.ts xp3ctr0@gmail.com');
    process.exit(1);
  }

  console.log('🌱 Iniciando seed de datos de prueba...\n');
  console.log('=' .repeat(60));

  try {
    // 1. Encontrar el tenant
    const tenant = await findTenantByUserEmail(email);

    // 2. Crear datos base
    const customers = await createCustomers(tenant.id, 50);
    const pets = await createPetsForCustomers(tenant.id, customers, 2);
    const staff = await createStaff(tenant.id, 5);
    const services = await createServices(tenant.id);
    const inventoryItems = await createInventoryItems(tenant.id);

    // 3. Crear datos relacionados
    const appointments = await createAppointments(tenant.id, pets, staff, 100);
    const medicalHistories = await createMedicalHistories(tenant.id, pets, staff, 80);
    const treatmentRecords = await createTreatmentRecords(tenant.id, pets, staff, 60);
    const reminders = await createReminders(tenant.id, pets, customers, 40);
    const inventoryMovements = await createInventoryMovements(tenant.id, inventoryItems, staff, 50);

    // 4. Mostrar resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE DATOS CREADOS');
    console.log('='.repeat(60));
    console.log(`👥 Clientes:                ${stats.customers}`);
    console.log(`🐾 Mascotas:                ${stats.pets}`);
    console.log(`👨‍⚕️ Staff:                   ${stats.staff}`);
    console.log(`💼 Servicios:               ${stats.services}`);
    console.log(`📦 Items de inventario:     ${stats.inventoryItems}`);
    console.log(`📅 Citas:                   ${stats.appointments}`);
    console.log(`📋 Historiales médicos:     ${stats.medicalHistories}`);
    console.log(`💉 Registros de tratamiento: ${stats.treatmentRecords}`);
    console.log(`🔔 Recordatorios:           ${stats.reminders}`);
    console.log(`📊 Movimientos inventario:  ${stats.inventoryMovements}`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      console.log('='.repeat(60));
      stats.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      console.log('='.repeat(60));
    }

    console.log('\n✅ Seed completado exitosamente!');
    console.log(`\n💡 Ahora puedes iniciar sesión como ${email} y explorar los datos de prueba.\n`);

  } catch (error) {
    console.error('\n❌ Error fatal durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
