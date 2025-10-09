#!/usr/bin/env node

/**
 * Seed demo data for a specific clinic
 * Creates fake customers and pets for testing
 *
 * Usage: node scripts/seed-demo-data.mjs <user-email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fake customer data
const fakeCustomers = [
  {
    firstName: "María",
    lastName: "González",
    name: "María González",
    email: "maria.gonzalez.demo@example.com",
    phone: "+52 55 1234 5678",
    address: "Calle Reforma 123, CDMX",
    pets: [
      {
        name: "Luna",
        species: "Perro",
        breed: "Golden Retriever",
        dateOfBirth: new Date("2020-03-15"),
        gender: "Hembra",
        weight: 28.5,
        weightUnit: "kg",
        isNeutered: true
      },
      {
        name: "Max",
        species: "Perro",
        breed: "Labrador",
        dateOfBirth: new Date("2019-07-22"),
        gender: "Macho",
        weight: 32.0,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  },
  {
    firstName: "Carlos",
    lastName: "Ramírez",
    name: "Carlos Ramírez",
    email: "carlos.ramirez.demo@example.com",
    phone: "+52 33 8765 4321",
    address: "Av. Juárez 456, Guadalajara",
    pets: [
      {
        name: "Michi",
        species: "Gato",
        breed: "Siamés",
        dateOfBirth: new Date("2021-01-10"),
        gender: "Macho",
        weight: 4.2,
        weightUnit: "kg",
        isNeutered: false
      }
    ]
  },
  {
    firstName: "Ana",
    lastName: "Martínez",
    name: "Ana Martínez",
    email: "ana.martinez.demo@example.com",
    phone: "+52 81 2468 1357",
    address: "Calle Hidalgo 789, Monterrey",
    pets: [
      {
        name: "Pelusa",
        species: "Gato",
        breed: "Persa",
        dateOfBirth: new Date("2020-11-05"),
        gender: "Hembra",
        weight: 3.8,
        weightUnit: "kg",
        isNeutered: true
      },
      {
        name: "Rocky",
        species: "Perro",
        breed: "Beagle",
        dateOfBirth: new Date("2018-05-20"),
        gender: "Macho",
        weight: 12.5,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  },
  {
    firstName: "Roberto",
    lastName: "Silva",
    name: "Roberto Silva",
    email: "roberto.silva.demo@example.com",
    phone: "+52 55 9876 5432",
    address: "Col. Roma Norte 321, CDMX",
    pets: [
      {
        name: "Toby",
        species: "Perro",
        breed: "French Bulldog",
        dateOfBirth: new Date("2022-02-14"),
        gender: "Macho",
        weight: 10.2,
        weightUnit: "kg",
        isNeutered: false
      }
    ]
  },
  {
    firstName: "Laura",
    lastName: "Torres",
    name: "Laura Torres",
    email: "laura.torres.demo@example.com",
    phone: "+52 33 5555 7777",
    address: "Av. Chapultepec 567, Guadalajara",
    pets: [
      {
        name: "Coco",
        species: "Gato",
        breed: "Maine Coon",
        dateOfBirth: new Date("2019-09-18"),
        gender: "Macho",
        weight: 6.5,
        weightUnit: "kg",
        isNeutered: true
      },
      {
        name: "Nala",
        species: "Gato",
        breed: "Bengalí",
        dateOfBirth: new Date("2021-06-30"),
        gender: "Hembra",
        weight: 4.0,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  },
  {
    firstName: "Diego",
    lastName: "Hernández",
    name: "Diego Hernández",
    email: "diego.hernandez.demo@example.com",
    phone: "+52 81 3333 9999",
    address: "Col. Del Valle 890, Monterrey",
    pets: [
      {
        name: "Bruno",
        species: "Perro",
        breed: "Pastor Alemán",
        dateOfBirth: new Date("2019-12-08"),
        gender: "Macho",
        weight: 38.0,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  },
  {
    firstName: "Patricia",
    lastName: "López",
    name: "Patricia López",
    email: "patricia.lopez.demo@example.com",
    phone: "+52 55 4444 8888",
    address: "Polanco 234, CDMX",
    pets: [
      {
        name: "Chispas",
        species: "Perro",
        breed: "Chihuahua",
        dateOfBirth: new Date("2020-08-25"),
        gender: "Hembra",
        weight: 2.8,
        weightUnit: "kg",
        isNeutered: false
      },
      {
        name: "Simba",
        species: "Gato",
        breed: "Naranja Común",
        dateOfBirth: new Date("2021-04-12"),
        gender: "Macho",
        weight: 5.2,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  },
  {
    firstName: "Fernando",
    lastName: "Castro",
    name: "Fernando Castro",
    email: "fernando.castro.demo@example.com",
    phone: "+52 33 6666 2222",
    address: "Zapopan 678, Guadalajara",
    pets: [
      {
        name: "Bella",
        species: "Perro",
        breed: "Poodle",
        dateOfBirth: new Date("2021-10-03"),
        gender: "Hembra",
        weight: 8.5,
        weightUnit: "kg",
        isNeutered: true
      }
    ]
  }
];

async function seedDemoData(userEmail) {
  console.log(`🌱 Seeding demo data for user: ${userEmail}\n`);

  try {
    // Find user and tenant
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        tenant: true
      }
    });

    if (!user) {
      console.error('❌ User not found with email:', userEmail);
      return;
    }

    if (!user.tenant) {
      console.error('❌ User does not have a tenant assigned');
      return;
    }

    const tenantId = user.tenant.id;
    console.log(`✅ Found tenant: ${user.tenant.name} (${tenantId})\n`);

    // Check if demo data already exists
    const existingCustomers = await prisma.customer.count({
      where: {
        tenantId,
        email: { endsWith: '.demo@example.com' }
      }
    });

    if (existingCustomers > 0) {
      console.log(`⚠️  Found ${existingCustomers} existing demo customers.`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Do you want to delete existing demo data and recreate? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting existing demo data...');
        await prisma.customer.deleteMany({
          where: {
            tenantId,
            email: { endsWith: '.demo@example.com' }
          }
        });
        console.log('✅ Existing demo data deleted\n');
      } else {
        console.log('❌ Aborted. Existing data preserved.');
        return;
      }
    }

    console.log('📝 Creating customers and pets...\n');

    let totalCustomers = 0;
    let totalPets = 0;

    for (const customerData of fakeCustomers) {
      const { pets, ...customerInfo } = customerData;

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          ...customerInfo,
          tenantId,
          source: 'MANUAL'
        }
      });

      totalCustomers++;
      console.log(`✅ Created customer: ${customer.name}`);

      // Create pets for this customer
      for (const petData of pets) {
        const pet = await prisma.pet.create({
          data: {
            ...petData,
            tenantId,
            customerId: customer.id
          }
        });

        totalPets++;
        console.log(`   🐾 Created pet: ${pet.name} (${pet.species} - ${pet.breed})`);
      }

      console.log('');
    }

    console.log('✨ Demo data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Customers created: ${totalCustomers}`);
    console.log(`   - Pets created: ${totalPets}`);
    console.log(`   - Total records: ${totalCustomers + totalPets}\n`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide a user email as argument');
  console.log('Usage: node scripts/seed-demo-data.mjs <user-email>');
  process.exit(1);
}

// Run the seed
seedDemoData(userEmail)
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
