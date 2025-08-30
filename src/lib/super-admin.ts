import { prisma } from './prisma';
import { getAuthenticatedUser } from './auth';

/**
 * Clave del rol de super admin del sistema
 */
const SUPER_ADMIN_ROLE_KEY = 'SUPER_ADMIN';

/**
 * Verificar si un usuario es super admin (por email o por rol)
 */
export async function isSuperAdmin(userId?: string, email?: string): Promise<boolean> {
  // Fallback to domain based check for legacy support
  if (email && (email.endsWith('@vetify.pro') || email.endsWith('@vetify.com') || email.endsWith('@alanis.dev'))) {
    return true;
  }

  if (!userId) return false;

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        key: SUPER_ADMIN_ROLE_KEY,
      },
    },
  });
  return Boolean(userRole);
}

/**
 * Obtener o crear el rol de super admin del sistema
 */
export async function getSuperAdminRole() {
  let superAdminRole = await prisma.role.findFirst({
    where: {
      key: SUPER_ADMIN_ROLE_KEY,
      tenantId: null, // Rol del sistema, no de tenant
    }
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        key: SUPER_ADMIN_ROLE_KEY,
        name: 'Super Administrador',
        isSystem: true,
        tenantId: null, // Rol global del sistema
      }
    });
  }

  return superAdminRole;
}

/**
 * Asignar rol de super admin a un usuario
 */
export async function assignSuperAdmin(userIdOrEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar que el usuario actual es super admin
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, message: 'No estás autenticado' };
    }
    const isCurrentUserSuperAdmin = await isSuperAdmin(currentUser.id);
    
    if (!isCurrentUserSuperAdmin) {
      return { success: false, message: 'No tienes permisos para asignar super administradores' };
    }

    // Buscar usuario por ID o email
    const user = await prisma.user.findFirst({
      where: userIdOrEmail.includes('@') 
        ? { email: userIdOrEmail }
        : { id: userIdOrEmail }
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Verificar si ya es super admin
    const isAlreadySuperAdmin = await isSuperAdmin(user.id);
    if (isAlreadySuperAdmin) {
      return { success: false, message: 'El usuario ya es super administrador' };
    }

    // Obtener o crear el rol de super admin
    const superAdminRole = await getSuperAdminRole();

    // Asignar el rol
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    return { 
      success: true, 
      message: `Usuario ${user.email} asignado como super administrador exitosamente` 
    };

  } catch (error) {
    console.error('Error assigning super admin:', error);
    return { 
      success: false, 
      message: 'Error interno del servidor' 
    };
  }
}

/**
 * Remover rol de super admin de un usuario
 */
export async function removeSuperAdmin(userIdOrEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar que el usuario actual es super admin
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, message: 'No estás autenticado' };
    }
    const isCurrentUserSuperAdmin = await isSuperAdmin(currentUser.id);
    
    if (!isCurrentUserSuperAdmin) {
      return { success: false, message: 'No tienes permisos para remover super administradores' };
    }

    // Buscar usuario por ID o email
    const user = await prisma.user.findFirst({
      where: userIdOrEmail.includes('@') 
        ? { email: userIdOrEmail }
        : { id: userIdOrEmail }
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // No permitir que un usuario se remueva a sí mismo
    if (user.id === currentUser.id) {
      return { success: false, message: 'No puedes remover tu propio rol de super administrador' };
    }

    // Obtener el rol de super admin
    const superAdminRole = await getSuperAdminRole();
    if (!superAdminRole) {
      return { success: false, message: 'Rol de super administrador no encontrado' };
    }

    // Buscar y remover la asignación del rol
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    if (!userRole) {
      return { success: false, message: 'El usuario no tiene el rol de super administrador' };
    }

    await prisma.userRole.delete({
      where: { id: userRole.id }
    });

    return { 
      success: true, 
      message: `Rol de super administrador removido de ${user.email} exitosamente` 
    };

  } catch (error) {
    console.error('Error removing super admin:', error);
    return { 
      success: false, 
      message: 'Error interno del servidor' 
    };
  }
}

/**
 * Listar todos los super administradores
 */
export async function listSuperAdmins() {
  try {
    // Verificar que el usuario actual es super admin
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      throw new Error('No estás autenticado');
    }
    const isCurrentUserSuperAdmin = await isSuperAdmin(currentUser.id);
    
    if (!isCurrentUserSuperAdmin) {
      throw new Error('No tienes permisos para ver la lista de super administradores');
    }

    const superAdminRole = await getSuperAdminRole();
    
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

    return superAdmins;

  } catch (error) {
    console.error('Error listing super admins:', error);
    throw error;
  }
}

/**
 * Verificar permisos de super admin para el usuario actual
 */
export async function requireSuperAdmin() {
  const user = await getAuthenticatedUser();
  const isAdmin = await isSuperAdmin(user.id, user.email);
  if (!isAdmin) {
    throw new Error('Access denied. Super admin privileges required.');
  }
  return { user };
}

/**
 * Inicializar el primer super admin (para setup inicial)
 */
export async function initializeFirstSuperAdmin(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar si ya existen super admins
    const existingSuperAdmins = await listSuperAdmins().catch(() => []);
    if (existingSuperAdmins.length > 0) {
      return { success: false, message: 'Ya existen super administradores en el sistema' };
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado con ese email' };
    }

    // Obtener o crear el rol de super admin
    const superAdminRole = await getSuperAdminRole();

    // Asignar el rol
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });

    return { 
      success: true, 
      message: `Primer super administrador inicializado exitosamente: ${user.email}` 
    };

  } catch (error) {
    console.error('Error initializing first super admin:', error);
    return { 
      success: false, 
      message: 'Error interno del servidor' 
    };
  }
} 