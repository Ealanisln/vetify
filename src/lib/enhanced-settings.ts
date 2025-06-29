import { prisma } from './prisma';
import { z } from 'zod';

// Settings schemas
export const clinicSettingsSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional(),
  website: z.string().url('URL inválida').optional(),
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }).optional(),
});

export const notificationSettingsSchema = z.object({
  whatsappEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
  smsEnabled: z.boolean().default(false),
  appointmentReminders: z.boolean().default(true),
  treatmentReminders: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  reminderHours: z.number().min(1).max(168).default(24), // 1 hour to 1 week
  templates: z.object({
    appointmentReminder: z.string().optional(),
    treatmentReminder: z.string().optional(),
    paymentReminder: z.string().optional(),
    petWelcome: z.string().optional(),
  }).optional(),
});

export const userRoleSchema = z.object({
  name: z.string().min(2, 'El nombre del rol debe tener al menos 2 caracteres'),
  key: z.string().min(2, 'La clave del rol debe tener al menos 2 caracteres'),
  permissions: z.array(z.string()).default([]),
  isSystem: z.boolean().default(false),
});

export type ClinicSettingsData = z.infer<typeof clinicSettingsSchema>;
export type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;
export type UserRoleData = z.infer<typeof userRoleSchema>;

// Default permissions available in the system
export const AVAILABLE_PERMISSIONS = [
  'appointments.read',
  'appointments.write',
  'appointments.delete',
  'customers.read',
  'customers.write',
  'customers.delete',
  'pets.read',
  'pets.write',
  'pets.delete',
  'medical.read',
  'medical.write',
  'medical.delete',
  'inventory.read',
  'inventory.write',
  'inventory.delete',
  'sales.read',
  'sales.write',
  'sales.delete',
  'staff.read',
  'staff.write',
  'staff.delete',
  'reports.read',
  'settings.read',
  'settings.write',
  'admin.all',
] as const;

// Settings service functions
export async function getClinicSettings(tenantId: string) {
  let settings = await prisma.tenantSettings.findUnique({
    where: { tenantId }
  });

  if (!settings) {
    // Get basic info from tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    // Create default settings
    settings = await prisma.tenantSettings.create({
      data: {
        tenantId,
        // Using individual fields from the actual schema
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        enableEmailReminders: true,
        enableSmsReminders: false,
        taxRate: 0,
        currencyCode: 'USD',
        currencySymbol: '$',
        appointmentDuration: 30,
      }
    });
  }

  return settings;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateClinicSettings(tenantId: string, data: ClinicSettingsData) {
  // TODO: This function needs to be updated to work with the actual TenantSettings schema
  // For now, just create/update basic settings to prevent build errors
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      // Map to actual schema fields when implemented
      timezone: 'UTC',
    },
    create: {
      tenantId,
      timezone: 'UTC',
      dateFormat: 'DD/MM/YYYY',
      enableEmailReminders: true,
      enableSmsReminders: false,
      taxRate: 0,
      currencyCode: 'USD',
      currencySymbol: '$',
      appointmentDuration: 30,
    }
  });

  return settings;
}

export async function getNotificationSettings(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId }
  });

  // TODO: Implement proper notification settings with schema update
  // For now, return default settings to prevent build errors
  return {
    whatsappEnabled: true,
    emailEnabled: settings?.enableEmailReminders || false,
    smsEnabled: settings?.enableSmsReminders || false,
    appointmentReminders: true,
    treatmentReminders: true,
    paymentReminders: true,
    reminderHours: 24,
    templates: {
      appointmentReminder: 'Hola {{customerName}}, recordatorio de cita para {{petName}} mañana a las {{appointmentTime}}. Clínica {{clinicName}}',
      treatmentReminder: 'Hola {{customerName}}, {{petName}} tiene programado {{treatmentType}} el {{treatmentDate}}. Clínica {{clinicName}}',
      paymentReminder: 'Hola {{customerName}}, tienes un pago pendiente de ${{amount}}. Clínica {{clinicName}}',
      petWelcome: '¡Bienvenido {{petName}} a nuestra clínica! Gracias por confiar en nosotros para el cuidado de tu mascota.',
    }
  };
}

export async function updateNotificationSettings(tenantId: string, data: NotificationSettingsData) {
  const validatedData = notificationSettingsSchema.parse(data);

  // TODO: This function needs to be updated to work with the actual TenantSettings schema
  // For now, return basic settings to prevent build errors
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      enableEmailReminders: validatedData.emailEnabled || false,
      enableSmsReminders: validatedData.smsEnabled || false,
    },
    create: {
      tenantId,
      timezone: 'UTC',
      dateFormat: 'DD/MM/YYYY',
      enableEmailReminders: validatedData.emailEnabled || false,
      enableSmsReminders: validatedData.smsEnabled || false,
      taxRate: 0,
      currencyCode: 'USD',
      currencySymbol: '$',
      appointmentDuration: 30,
    }
  });

  return settings;
}

// User role management
export async function getUserRoles(tenantId: string) {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    include: {
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      }
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' }
    ]
  });

  return roles;
}

export async function createUserRole(tenantId: string, data: UserRoleData) {
  const validatedData = userRoleSchema.parse(data);

  // Check if role key already exists
  const existingRole = await prisma.role.findFirst({
    where: {
      tenantId,
      key: validatedData.key
    }
  });

  if (existingRole) {
    throw new Error('Ya existe un rol con esta clave');
  }

  const role = await prisma.role.create({
    data: {
      name: validatedData.name,
      key: validatedData.key,
      tenantId,
      // TODO: Add permissions field to Role model
      // permissions: validatedData.permissions,
    }
  });

  return role;
}

export async function updateUserRole(tenantId: string, roleId: string, data: Partial<UserRoleData>) {
  const existingRole = await prisma.role.findFirst({
    where: {
      id: roleId,
      tenantId,
    }
  });

  if (!existingRole) {
    throw new Error('Rol no encontrado');
  }

  if (existingRole.isSystem) {
    throw new Error('No se pueden modificar los roles del sistema');
  }

  const validatedData = userRoleSchema.partial().parse(data);

  // Check if key is being updated and conflicts
  if (validatedData.key && validatedData.key !== existingRole.key) {
    const keyConflict = await prisma.role.findFirst({
      where: {
        tenantId,
        key: validatedData.key,
        id: { not: roleId }
      }
    });

    if (keyConflict) {
      throw new Error('Ya existe un rol con esta clave');
    }
  }

  const updatedRole = await prisma.role.update({
    where: { id: roleId },
    data: {
      ...validatedData,
      updatedAt: new Date(),
    }
  });

  return updatedRole;
}

export async function deleteUserRole(tenantId: string, roleId: string) {
  const existingRole = await prisma.role.findFirst({
    where: {
      id: roleId,
      tenantId,
    },
    include: {
      userRoles: true
    }
  });

  if (!existingRole) {
    throw new Error('Rol no encontrado');
  }

  if (existingRole.isSystem) {
    throw new Error('No se pueden eliminar los roles del sistema');
  }

  if (existingRole.userRoles.length > 0) {
    throw new Error('No se puede eliminar un rol que está asignado a usuarios');
  }

  await prisma.role.delete({
    where: { id: roleId }
  });

  return { success: true };
}

export async function assignUserRole(tenantId: string, userId: string, roleId: string) {
  // Verify user belongs to tenant
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verify role belongs to tenant
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      tenantId,
    }
  });

  if (!role) {
    throw new Error('Rol no encontrado');
  }

  // Check if assignment already exists
  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId,
    }
  });

  if (existingAssignment) {
    throw new Error('El usuario ya tiene este rol asignado');
  }

  const userRole = await prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
    include: {
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  return userRole;
}

export async function removeUserRole(userId: string, roleId: string) {
  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId,
    }
  });

  if (!existingAssignment) {
    throw new Error('Asignación de rol no encontrada');
  }

  await prisma.userRole.delete({
    where: { id: existingAssignment.id }
  });

  return { success: true };
}

// Initialize default system roles for a tenant
export async function initializeDefaultRoles(tenantId: string) {
  const defaultRoles = [
    {
      key: 'admin',
      name: 'Administrador',
      permissions: ['admin.all'],
      isSystem: true,
    },
    {
      key: 'veterinarian',
      name: 'Veterinario',
      permissions: [
        'appointments.read', 'appointments.write',
        'customers.read', 'customers.write',
        'pets.read', 'pets.write',
        'medical.read', 'medical.write',
        'inventory.read',
        'reports.read',
      ],
      isSystem: true,
    },
    {
      key: 'assistant',
      name: 'Asistente',
      permissions: [
        'appointments.read', 'appointments.write',
        'customers.read', 'customers.write',
        'pets.read', 'pets.write',
        'inventory.read',
        'sales.read', 'sales.write',
      ],
      isSystem: true,
    },
    {
      key: 'receptionist',
      name: 'Recepcionista',
      permissions: [
        'appointments.read', 'appointments.write',
        'customers.read', 'customers.write',
        'pets.read',
        'sales.read',
      ],
      isSystem: true,
    },
  ];

  const createdRoles = [];

  for (const roleData of defaultRoles) {
    const existingRole = await prisma.role.findFirst({
      where: {
        tenantId,
        key: roleData.key,
      }
    });

    if (!existingRole) {
      const role = await prisma.role.create({
        data: {
          ...roleData,
          tenantId,
        }
      });
      createdRoles.push(role);
    }
  }

  return createdRoles;
} 