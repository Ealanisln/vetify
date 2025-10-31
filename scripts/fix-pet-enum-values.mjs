#!/usr/bin/env node

/**
 * Fix existing pet records with Spanish enum values
 * Converts species and gender from Spanish to English
 *
 * ⚠️ WARNING: This is a ONE-TIME migration script that has already been run.
 * This script modifies production data. Only run if you know what you're doing.
 *
 * Usage: node scripts/fix-pet-enum-values.mjs
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Safety check: prevent accidental execution in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script cannot be run in production environment.');
  console.error('This is a one-time migration script that should only be run manually with caution.');
  process.exit(1);
}

// Mapping tables
const speciesMap = {
  'Perro': 'dog',
  'Gato': 'cat',
  'Ave': 'bird',
  'Conejo': 'rabbit',
  'Reptil': 'other',
  'Otro': 'other'
};

const genderMap = {
  'Macho': 'male',
  'Hembra': 'female',
  'MALE': 'male',
  'FEMALE': 'female'
};

async function confirmExecution() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  This script will modify pet enum values in the database. Continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function fixPetEnumValues() {
  console.log('🔧 Pet Enum Migration Script\n');
  console.log('⚠️  WARNING: This script has already been run once.');
  console.log('It should only be executed again if you know what you\'re doing.\n');

  const confirmed = await confirmExecution();
  if (!confirmed) {
    console.log('❌ Migration cancelled by user.');
    process.exit(0);
  }

  console.log('\n🔧 Starting migration...\n');

  try {
    // Find all pets with Spanish or incorrect values
    const allPets = await prisma.pet.findMany({
      select: {
        id: true,
        name: true,
        species: true,
        gender: true
      }
    });

    console.log(`📊 Found ${allPets.length} total pets\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    // Wrap all updates in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const pet of allPets) {
        const needsSpeciesFix = speciesMap.hasOwnProperty(pet.species);
        const needsGenderFix = genderMap.hasOwnProperty(pet.gender);

        if (needsSpeciesFix || needsGenderFix) {
          const updates = {};

          if (needsSpeciesFix) {
            updates.species = speciesMap[pet.species];
            console.log(`  🔄 ${pet.name}: species "${pet.species}" → "${updates.species}"`);
          }

          if (needsGenderFix) {
            updates.gender = genderMap[pet.gender];
            console.log(`  🔄 ${pet.name}: gender "${pet.gender}" → "${updates.gender}"`);
          }

          await tx.pet.update({
            where: { id: pet.id },
            data: updates
          });

          fixedCount++;
        } else {
          alreadyCorrectCount++;
        }
      }
    });

    console.log('\n✨ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Pets fixed: ${fixedCount}`);
    console.log(`   ✓ Already correct: ${alreadyCorrectCount}`);
    console.log(`   📦 Total processed: ${allPets.length}\n`);

  } catch (error) {
    console.error('❌ Error fixing pet enum values:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixPetEnumValues()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

