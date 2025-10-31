#!/usr/bin/env node

/**
 * Fix existing pet records with Spanish enum values
 * Converts species and gender from Spanish to English
 * 
 * Usage: node scripts/fix-pet-enum-values.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function fixPetEnumValues() {
  console.log('🔧 Fixing pet enum values...\n');

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

        await prisma.pet.update({
          where: { id: pet.id },
          data: updates
        });

        fixedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }

    console.log('\n✨ Migration completed!\n');
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

