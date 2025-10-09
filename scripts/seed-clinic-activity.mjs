#!/usr/bin/env node

/**
 * Seed clinic activity data (appointments, inventory, sales, etc.)
 * Makes the demo clinic look like it's being actively used
 *
 * Usage: node scripts/seed-clinic-activity.mjs <user-email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inventory items for a veterinary clinic
const inventoryItems = [
  // Medicines
  { name: 'Amoxicilina 500mg', category: 'MEDICINE', description: 'Antibiótico de amplio espectro', activeCompound: 'Amoxicilina', presentation: 'Tabletas', measure: '500mg', brand: 'Vetpharma', cost: 150, price: 250, quantity: 45, minStock: 10 },
  { name: 'Carprofeno 75mg', category: 'MEDICINE', description: 'Antiinflamatorio no esteroideo', activeCompound: 'Carprofeno', presentation: 'Tabletas', measure: '75mg', brand: 'VetPlus', cost: 200, price: 350, quantity: 30, minStock: 8 },
  { name: 'Meloxicam 1.5mg/ml', category: 'MEDICINE', description: 'Antiinflamatorio inyectable', activeCompound: 'Meloxicam', presentation: 'Inyectable', measure: '20ml', brand: 'MediVet', cost: 180, price: 300, quantity: 25, minStock: 5 },

  // Vaccines
  { name: 'Vacuna Séxtuple Canina', category: 'VACCINE', description: 'Protección contra 6 enfermedades', activeCompound: 'Vacuna polivalente', presentation: 'Ampolleta', measure: '1ml', brand: 'Zoetis', cost: 280, price: 450, quantity: 20, minStock: 10 },
  { name: 'Vacuna Antirrábica', category: 'VACCINE', description: 'Vacuna contra rabia', activeCompound: 'Virus inactivado', presentation: 'Ampolleta', measure: '1ml', brand: 'Pfizer', cost: 150, price: 250, quantity: 35, minStock: 15 },
  { name: 'Vacuna Triple Felina', category: 'VACCINE', description: 'Para gatos (rinotraqueitis, calicivirus, panleucopenia)', activeCompound: 'Vacuna polivalente', presentation: 'Ampolleta', measure: '1ml', brand: 'Virbac', cost: 220, price: 380, quantity: 18, minStock: 8 },

  // Dewormers
  { name: 'Drontal Plus', category: 'DEWORMER', description: 'Desparasitante interno perros', activeCompound: 'Praziquantel + Pirantel', presentation: 'Tabletas', measure: '10kg', brand: 'Bayer', cost: 120, price: 200, quantity: 40, minStock: 15 },
  { name: 'Milbemax Gatos', category: 'DEWORMER', description: 'Desparasitante interno gatos', activeCompound: 'Milbemicina + Praziquantel', presentation: 'Tabletas', measure: '2-8kg', brand: 'Elanco', cost: 100, price: 180, quantity: 35, minStock: 12 },

  // Flea & Tick Prevention
  { name: 'Bravecto 20-40kg', category: 'FLEA_TICK_PREVENTION', description: 'Protección pulgas y garrapatas 12 semanas', activeCompound: 'Fluralaner', presentation: 'Tableta masticable', measure: '20-40kg', brand: 'MSD', cost: 350, price: 580, quantity: 15, minStock: 8 },
  { name: 'Frontline Spray', category: 'FLEA_TICK_PREVENTION', description: 'Spray antipulgas multiespecie', activeCompound: 'Fipronil', presentation: 'Spray', measure: '250ml', brand: 'Boehringer', cost: 280, price: 450, quantity: 12, minStock: 5 },

  // Food
  { name: 'Royal Canin Renal Canino', category: 'FOOD_PRESCRIPTION', description: 'Alimento terapéutico renal', presentation: 'Bolsa', measure: '7.5kg', brand: 'Royal Canin', cost: 850, price: 1350, quantity: 8, minStock: 3 },
  { name: 'Hill\'s c/d Felino', category: 'FOOD_PRESCRIPTION', description: 'Alimento para salud urinaria', presentation: 'Bolsa', measure: '3.5kg', brand: 'Hill\'s', cost: 680, price: 1100, quantity: 10, minStock: 4 },
  { name: 'Purina Pro Plan Adulto', category: 'FOOD_REGULAR', description: 'Alimento premium adulto', presentation: 'Bolsa', measure: '15kg', brand: 'Purina', cost: 650, price: 980, quantity: 12, minStock: 5 },

  // Accessories
  { name: 'Collar Isabelino M', category: 'ACCESSORY', description: 'Collar protector mediano', presentation: 'Unidad', measure: 'M', brand: 'VetPlus', cost: 80, price: 150, quantity: 20, minStock: 5 },
  { name: 'Jeringa 3ml', category: 'CONSUMABLE_CLINIC', description: 'Jeringa descartable estéril', presentation: 'Pack 100u', measure: '3ml', brand: 'BD', cost: 180, price: 280, quantity: 5, minStock: 2 },
  { name: 'Guantes Nitrilo M', category: 'CONSUMABLE_CLINIC', description: 'Guantes descartables', presentation: 'Caja 100u', measure: 'M', brand: 'MediGlove', cost: 150, price: 250, quantity: 8, minStock: 3 },
];

// Services offered by the clinic
const services = [
  { name: 'Consulta General', category: 'CONSULTATION', description: 'Revisión general y diagnóstico', price: 350, duration: 30 },
  { name: 'Consulta de Emergencia', category: 'EMERGENCY_CARE', description: 'Atención urgente fuera de horario', price: 800, duration: 45 },
  { name: 'Vacunación', category: 'VACCINATION', description: 'Aplicación de vacunas', price: 200, duration: 15 },
  { name: 'Desparasitación', category: 'DEWORMING', description: 'Tratamiento antiparasitario', price: 150, duration: 15 },
  { name: 'Esterilización Canino', category: 'SURGERY', description: 'Castración quirúrgica perro', price: 2500, duration: 120 },
  { name: 'Esterilización Felino', category: 'SURGERY', description: 'Castración quirúrgica gato', price: 1800, duration: 90 },
  { name: 'Limpieza Dental', category: 'DENTAL_CARE', description: 'Profilaxis dental con anestesia', price: 1500, duration: 60 },
  { name: 'Baño Medicado', category: 'GROOMING', description: 'Baño con shampoo especializado', price: 450, duration: 45 },
  { name: 'Corte de Uñas', category: 'GROOMING', description: 'Corte de uñas y limado', price: 150, duration: 15 },
  { name: 'Radiografía', category: 'IMAGING_RADIOLOGY', description: 'Estudio radiológico', price: 650, duration: 30 },
  { name: 'Ultrasonido', category: 'IMAGING_RADIOLOGY', description: 'Estudio ecográfico', price: 850, duration: 30 },
  { name: 'Análisis de Sangre Completo', category: 'LABORATORY_TEST', description: 'Hemograma completo', price: 550, duration: 30 },
];

// Generate appointments for the next 2 weeks
function generateAppointments(customers, staff) {
  const appointments = [];
  const now = new Date();
  const reasons = [
    'Consulta general',
    'Vacunación anual',
    'Revisión post-cirugía',
    'Control de peso',
    'Chequeo de rutina',
    'Desparasitación',
    'Problemas digestivos',
    'Limpieza dental',
    'Corte de uñas',
    'Cambio de alimentación'
  ];

  const statuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED'];

  // Create appointments for past 7 days (mostly completed)
  for (let i = 7; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(9 + Math.floor(Math.random() * 8), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const pet = customer.pets[Math.floor(Math.random() * customer.pets.length)];

    appointments.push({
      dateTime: date,
      petId: pet.id,
      customerId: customer.id,
      staffId: staff?.id || null,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: 'COMPLETED',
      duration: 30,
      notes: 'Mascota en buen estado general'
    });
  }

  // Create appointments for next 14 days (scheduled/confirmed)
  for (let i = 0; i < 14; i++) {
    const numAppointments = Math.floor(Math.random() * 4) + 2; // 2-5 appointments per day

    for (let j = 0; j < numAppointments; j++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(9 + Math.floor(Math.random() * 8), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);

      const customer = customers[Math.floor(Math.random() * customers.length)];
      const pet = customer.pets[Math.floor(Math.random() * customer.pets.length)];

      appointments.push({
        dateTime: date,
        petId: pet.id,
        customerId: customer.id,
        staffId: staff?.id || null,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        status: i === 0 ? 'CONFIRMED' : 'SCHEDULED',
        duration: 30
      });
    }
  }

  return appointments;
}

// Generate some sales records
function generateSales(customers, staff, inventoryItemsIds, servicesIds) {
  const sales = [];
  const now = new Date();

  // Generate 5-10 sales from the past week
  const numSales = Math.floor(Math.random() * 6) + 5;

  for (let i = 0; i < numSales; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const pet = customer.pets[Math.floor(Math.random() * customer.pets.length)];

    // Random items (1-3 items per sale)
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const isService = Math.random() > 0.5;

      if (isService && servicesIds.length > 0) {
        const service = servicesIds[Math.floor(Math.random() * servicesIds.length)];
        const price = service.price;
        items.push({
          serviceId: service.id,
          description: service.name,
          quantity: 1,
          unitPrice: price,
          total: price
        });
        subtotal += Number(price);
      } else if (inventoryItemsIds.length > 0) {
        const item = inventoryItemsIds[Math.floor(Math.random() * inventoryItemsIds.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const price = item.price;
        const total = Number(price) * quantity;

        items.push({
          itemId: item.id,
          description: item.name,
          quantity,
          unitPrice: price,
          total
        });
        subtotal += total;
      }
    }

    if (items.length > 0) {
      sales.push({
        customer,
        pet,
        staff,
        items,
        subtotal,
        date
      });
    }
  }

  return sales;
}

async function seedClinicActivity(userEmail) {
  console.log(`🏥 Seeding clinic activity data for user: ${userEmail}\n`);

  try {
    // Find user and tenant
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        tenant: true
      }
    });

    if (!user || !user.tenant) {
      console.error('❌ User or tenant not found');
      return;
    }

    const tenantId = user.tenant.id;
    console.log(`✅ Found tenant: ${user.tenant.name}\n`);

    // Get existing customers with pets
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: { pets: true }
    });

    if (customers.length === 0) {
      console.error('❌ No customers found. Run seed-demo-data.mjs first');
      return;
    }

    console.log(`✅ Found ${customers.length} customers\n`);

    // Get or create staff member
    let staff = await prisma.staff.findFirst({
      where: { tenantId }
    });

    if (!staff) {
      console.log('📝 Creating staff member...');
      staff = await prisma.staff.create({
        data: {
          tenantId,
          userId: user.id,
          name: user.name || user.email.split('@')[0],
          position: 'Veterinario',
          email: user.email,
          phone: user.phone
        }
      });
      console.log(`✅ Created staff: ${staff.name}\n`);
    }

    // Create inventory items
    console.log('📦 Creating inventory items...');
    const createdInventory = [];

    for (const item of inventoryItems) {
      const created = await prisma.inventoryItem.create({
        data: {
          ...item,
          tenantId,
          status: item.quantity > item.minStock ? 'ACTIVE' : 'LOW_STOCK'
        }
      });
      createdInventory.push(created);
    }
    console.log(`✅ Created ${createdInventory.length} inventory items\n`);

    // Create services
    console.log('🔧 Creating services...');
    const createdServices = [];

    for (const service of services) {
      const created = await prisma.service.create({
        data: {
          ...service,
          tenantId
        }
      });
      createdServices.push(created);
    }
    console.log(`✅ Created ${createdServices.length} services\n`);

    // Create appointments
    console.log('📅 Creating appointments...');
    const appointmentsData = generateAppointments(customers, staff);

    for (const appt of appointmentsData) {
      await prisma.appointment.create({
        data: {
          ...appt,
          tenantId,
          userId: user.id
        }
      });
    }
    console.log(`✅ Created ${appointmentsData.length} appointments\n`);

    // Create sales
    console.log('💰 Creating sales records...');
    const salesData = generateSales(customers, staff, createdInventory, createdServices);
    let saleNumber = 1000;

    for (const saleData of salesData) {
      const sale = await prisma.sale.create({
        data: {
          tenantId,
          customerId: saleData.customer.id,
          petId: saleData.pet.id,
          userId: user.id,
          staffId: staff.id,
          saleNumber: `VNT-${saleNumber++}`,
          subtotal: saleData.subtotal,
          tax: saleData.subtotal * 0.16, // 16% IVA
          total: saleData.subtotal * 1.16,
          status: 'COMPLETED',
          createdAt: saleData.date
        }
      });

      // Create sale items
      for (const item of saleData.items) {
        await prisma.saleItem.create({
          data: {
            ...item,
            saleId: sale.id
          }
        });
      }

      // Create payment
      await prisma.salePayment.create({
        data: {
          saleId: sale.id,
          paymentMethod: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD'][Math.floor(Math.random() * 3)],
          amount: sale.total,
          paymentDate: saleData.date
        }
      });
    }
    console.log(`✅ Created ${salesData.length} sales\n`);

    // Summary
    console.log('✨ Clinic activity seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Inventory items: ${createdInventory.length}`);
    console.log(`   - Services: ${createdServices.length}`);
    console.log(`   - Appointments: ${appointmentsData.length}`);
    console.log(`   - Sales: ${salesData.length}`);
    console.log(`   - Staff members: 1\n`);

  } catch (error) {
    console.error('❌ Error seeding clinic activity:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide a user email as argument');
  console.log('Usage: node scripts/seed-clinic-activity.mjs <user-email>');
  process.exit(1);
}

// Run the seed
seedClinicActivity(userEmail)
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
