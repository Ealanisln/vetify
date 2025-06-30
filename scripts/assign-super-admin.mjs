#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

/**
 * Script para asignar un usuario como super administrador
 * Uso: node scripts/assign-super-admin.mjs <email>
 */

const SUPER_ADMIN_ROLE_KEY = 'SUPER_ADMIN';

async function getSuperAdminRole() {
  let superAdminRole = await prisma.role.findFirst({
    where: {
      key: SUPER_ADMIN_ROLE_KEY,
      tenantId: null,
    }
  });

  if (!superAdminRole) {
    console.log('🔧 Creando rol de super administrador...');
    superAdminRole = await prisma.role.create({
      data: {
        key: SUPER_ADMIN_ROLE_KEY,
        name: 'Super Administrador',
        isSystem: true,
        tenantId: null,
      }
    });
    console.log('✅ Rol de super administrador creado');
  }

  return superAdminRole;
}

async function assignSuperAdmin(email) {
  try {
    console.log(`🔍 Buscando usuario con email: ${email}`);
    
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado con email: ${email}`);
      console.log('\n💡 Tip: El usuario debe haber iniciado sesión al menos una vez para existir en la base de datos.');
      return false;
    }

    console.log(`👤 Usuario encontrado: ${user.name || user.email}`);

    // Obtener o crear el rol de super admin
    const superAdminRole = await getSuperAdminRole();

    // Verificar si ya tiene el rol
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    if (existingRole) {
      console.log('ℹ️  El usuario ya es super administrador');
      return true;
    }

    // Asignar el rol
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    console.log('🎉 ¡Super administrador asignado exitosamente!');
    console.log(`📧 Usuario: ${user.email}`);
    console.log(`👑 Rol: Super Administrador`);
    
    return true;

  } catch (error) {
    console.error('❌ Error al asignar super administrador:', error);
    return false;
  }
}

async function listSuperAdmins() {
  try {
    console.log('📋 Lista de Super Administradores:');
    console.log('=' .repeat(50));

    const superAdminRole = await prisma.role.findFirst({
      where: {
        key: SUPER_ADMIN_ROLE_KEY,
        tenantId: null,
      }
    });

    // Usuarios con rol de super admin
    const userRoles = superAdminRole ? await prisma.userRole.findMany({
      where: {
        roleId: superAdminRole.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isActive: true,
          }
        }
      }
    }) : [];

    // Usuarios con email de dominios autorizados
    const emailSuperAdmins = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@vetify.pro' } },
          { email: { endsWith: '@vetify.com' } },
          { email: { endsWith: '@alanis.dev' } },
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isActive: true,
      }
    });

    // Combinar y deduplicar
    const superAdmins = [
      ...userRoles.map(ur => ({ ...ur.user, assignedByRole: true })),
      ...emailSuperAdmins
        .filter(user => !userRoles.some(ur => ur.user.id === user.id))
        .map(user => ({ ...user, assignedByRole: false }))
    ];

    if (superAdmins.length === 0) {
      console.log('ℹ️  No hay super administradores asignados');
      return;
    }

    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Nombre: ${admin.name || 'No especificado'}`);
      console.log(`   Método: ${admin.assignedByRole ? 'Rol asignado' : 'Email de dominio'}`);
      console.log(`   Estado: ${admin.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error al listar super administradores:', error);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('🚀 Script de Gestión de Super Administradores');
      console.log('');
      console.log('Uso:');
      console.log('  node scripts/assign-super-admin.mjs <email>     # Asignar super admin');
      console.log('  node scripts/assign-super-admin.mjs --list     # Listar super admins');
      console.log('');
      console.log('Ejemplos:');
      console.log('  node scripts/assign-super-admin.mjs tu@email.com');
      console.log('  node scripts/assign-super-admin.mjs --list');
      return;
    }

    if (args[0] === '--list' || args[0] === '-l') {
      await listSuperAdmins();
      return;
    }

    const email = args[0];
    
    if (!email.includes('@')) {
      console.error('❌ Por favor proporciona un email válido');
      return;
    }

    console.log('🚀 Iniciando asignación de super administrador...');
    console.log('');

    const success = await assignSuperAdmin(email);
    
    if (success) {
      console.log('');
      console.log('✅ Proceso completado exitosamente');
      console.log('');
      console.log('📝 Próximos pasos:');
      console.log('1. El usuario ya puede acceder al panel de admin en /admin');
      console.log('2. Desde allí puede asignar otros super administradores');
      console.log('3. Use --list para ver todos los super administradores');
    } else {
      console.log('');
      console.log('❌ El proceso falló. Revisa los errores arriba.');
    }

  } catch (error) {
    console.error('💥 Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 