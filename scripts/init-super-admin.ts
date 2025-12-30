/**
 * Script to initialize the first super-admin in the database
 *
 * Usage: npx tsx scripts/init-super-admin.ts [email]
 *
 * If no email is provided, defaults to emmanuel@alanis.dev
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env (primary database config)
config({ path: '.env' });

const prisma = new PrismaClient();

const SUPER_ADMIN_ROLE_KEY = 'SUPER_ADMIN';
const DEFAULT_EMAIL = 'emmanuel@alanis.dev';

async function initSuperAdmin(email: string) {
  console.log('🔐 Initializing Super Admin');
  console.log('===========================\n');

  try {
    // 1. Find user by email
    console.log(`📧 Looking for user with email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('\n💡 Make sure the user has logged in at least once to create their account.');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.firstName || user.email} (${user.id})\n`);

    // 2. Get or create the super admin role
    console.log('🔑 Setting up Super Admin role...');
    let superAdminRole = await prisma.role.findFirst({
      where: {
        key: SUPER_ADMIN_ROLE_KEY,
        tenantId: null, // System role, not tenant-specific
      }
    });

    if (!superAdminRole) {
      console.log('   Creating new Super Admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          key: SUPER_ADMIN_ROLE_KEY,
          name: 'Super Administrador',
          isSystem: true,
          tenantId: null,
        }
      });
      console.log(`   ✅ Role created with ID: ${superAdminRole.id}`);
    } else {
      console.log(`   ✅ Role already exists with ID: ${superAdminRole.id}`);
    }

    // 3. Check if user already has the role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    if (existingUserRole) {
      console.log(`\n✅ User ${email} is already a Super Admin!`);
      console.log('   No changes needed.');
    } else {
      // 4. Assign the role to the user
      console.log(`\n👤 Assigning Super Admin role to ${email}...`);
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
        }
      });
      console.log('   ✅ Role assigned successfully!');
    }

    // 5. Verify
    console.log('\n📋 Verification:');
    const verification = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        role: {
          key: SUPER_ADMIN_ROLE_KEY,
        }
      },
      include: {
        user: { select: { email: true, name: true } },
        role: { select: { key: true, name: true } }
      }
    });

    if (verification) {
      console.log(`   ✅ ${verification.user.email} has role: ${verification.role.name}`);
    }

    console.log('\n🎉 Super Admin initialization complete!');
    console.log('   You can now access /admin with this account.\n');

  } catch (error) {
    console.error('❌ Error initializing super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line args or use default
const email = process.argv[2] || DEFAULT_EMAIL;

initSuperAdmin(email);
