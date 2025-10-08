import { z } from 'zod';
import { commonSchemas } from './input-sanitization';

/**
 * Enhanced validation schemas for all API endpoints
 * These schemas include comprehensive sanitization and security validation
 */

// Customer validation schemas
export const customerSchemas = {
  create: z.object({
    name: commonSchemas.name,
    email: z.string().email().max(254).toLowerCase(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    address: commonSchemas.address.optional(),
    city: commonSchemas.name.optional(),
    state: commonSchemas.name.optional(),
    postalCode: commonSchemas.postalCode.optional(),
    country: commonSchemas.countryCode.optional(),
    notes: commonSchemas.description.optional(),
    emergencyContact: z.object({
      name: commonSchemas.name,
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
      relationship: commonSchemas.name.optional(),
    }).optional(),
  }),

  update: z.object({
    name: commonSchemas.name.optional(),
    email: z.string().email().max(254).toLowerCase().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    address: commonSchemas.address.optional(),
    city: commonSchemas.name.optional(),
    state: commonSchemas.name.optional(),
    postalCode: commonSchemas.postalCode.optional(),
    country: commonSchemas.countryCode.optional(),
    notes: commonSchemas.description.optional(),
    emergencyContact: z.object({
      name: commonSchemas.name,
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
      relationship: commonSchemas.name.optional(),
    }).optional(),
  }),

  query: z.object({
    search: z.string().max(100).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^[1-9]\d{0,1}$/).transform(Number).optional(), // 1-99
  }),
};

// Pet validation schemas
export const petSchemas = {
  create: z.object({
    name: commonSchemas.name,
    species: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'REPTILE', 'FISH', 'OTHER']),
    breed: commonSchemas.name.optional(),
    color: commonSchemas.name.optional(),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
    birthDate: z.string().datetime().optional(),
    weight: commonSchemas.amount.optional(),
    microchipId: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    notes: commonSchemas.description.optional(),
    customerId: commonSchemas.id,
    isActive: z.boolean().default(true),
  }),

  update: z.object({
    name: commonSchemas.name.optional(),
    species: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'REPTILE', 'FISH', 'OTHER']).optional(),
    breed: commonSchemas.name.optional(),
    color: commonSchemas.name.optional(),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
    birthDate: z.string().datetime().optional(),
    weight: commonSchemas.amount.optional(),
    microchipId: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    notes: commonSchemas.description.optional(),
    isActive: z.boolean().optional(),
  }),
};

// Medical record validation schemas
export const medicalSchemas = {
  consultation: z.object({
    petId: commonSchemas.id,
    staffId: commonSchemas.id,
    type: z.enum(['ROUTINE_CHECKUP', 'EMERGENCY', 'FOLLOW_UP', 'VACCINATION', 'SURGERY', 'DENTAL', 'GROOMING', 'OTHER']),
    reason: commonSchemas.safeString,
    symptoms: commonSchemas.medicalText.optional(),
    diagnosis: commonSchemas.medicalText.optional(),
    treatment: commonSchemas.medicalText.optional(),
    prescription: commonSchemas.medicalText.optional(),
    notes: commonSchemas.medicalText.optional(),
    followUpDate: z.string().datetime().optional(),
    cost: commonSchemas.amount.optional(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  }),

  vaccination: z.object({
    petId: commonSchemas.id,
    vaccineType: commonSchemas.safeString,
    vaccineBrand: commonSchemas.safeString.optional(),
    batchNumber: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    administeredDate: z.string().datetime(),
    expirationDate: z.string().datetime().optional(),
    nextDueDate: z.string().datetime().optional(),
    staffId: commonSchemas.id,
    notes: commonSchemas.description.optional(),
    reactions: commonSchemas.medicalText.optional(),
  }),

  vitals: z.object({
    petId: commonSchemas.id,
    weight: commonSchemas.amount.optional(),
    temperature: z.number().min(35).max(45).optional(), // Celsius
    heartRate: z.number().min(10).max(300).optional(), // BPM
    respiratoryRate: z.number().min(5).max(100).optional(), // Per minute
    bloodPressureSystolic: z.number().min(50).max(300).optional(),
    bloodPressureDiastolic: z.number().min(30).max(200).optional(),
    notes: commonSchemas.description.optional(),
    recordedBy: commonSchemas.id,
    recordedAt: z.string().datetime(),
  }),

  treatment: z.object({
    petId: commonSchemas.id,
    consultationId: commonSchemas.id.optional(),
    type: z.enum(['MEDICATION', 'SURGERY', 'THERAPY', 'PROCEDURE', 'DIAGNOSTIC', 'OTHER']),
    name: commonSchemas.safeString,
    description: commonSchemas.medicalText.optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    frequency: commonSchemas.safeString.optional(),
    dosage: commonSchemas.safeString.optional(),
    instructions: commonSchemas.medicalText.optional(),
    cost: commonSchemas.amount.optional(),
    staffId: commonSchemas.id,
    status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED', 'PAUSED']).default('ACTIVE'),
  }),
};

// Appointment validation schemas
export const appointmentSchemas = {
  create: z.object({
    dateTime: z.string().datetime(),
    duration: z.number().min(15).max(480).default(30), // 15 minutes to 8 hours
    customerId: commonSchemas.id,
    petId: commonSchemas.id,
    reason: commonSchemas.safeString,
    type: z.enum(['ROUTINE_CHECKUP', 'EMERGENCY', 'FOLLOW_UP', 'VACCINATION', 'SURGERY', 'DENTAL', 'GROOMING', 'CONSULTATION', 'OTHER']),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']).default('SCHEDULED'),
    notes: commonSchemas.description.optional(),
    staffId: commonSchemas.id.optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    estimatedCost: commonSchemas.amount.optional(),
  }),

  update: z.object({
    dateTime: z.string().datetime().optional(),
    duration: z.number().min(15).max(480).optional(),
    reason: commonSchemas.safeString.optional(),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']).optional(),
    notes: commonSchemas.description.optional(),
    staffId: commonSchemas.id.optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    estimatedCost: commonSchemas.amount.optional(),
    actualCost: commonSchemas.amount.optional(),
  }),

  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']).optional(),
    staffId: commonSchemas.id.optional(),
    customerId: commonSchemas.id.optional(),
    petId: commonSchemas.id.optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^[1-9]\d{0,1}$/).transform(Number).optional(),
  }),
};

// Staff validation schemas
export const staffSchemas = {
  create: z.object({
    name: commonSchemas.name,
    email: z.string().email().max(254).toLowerCase(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    position: z.enum(['VETERINARIAN', 'VETERINARY_TECHNICIAN', 'ASSISTANT', 'RECEPTIONIST', 'MANAGER', 'GROOMER', 'OTHER']),
    licenseNumber: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    specializations: z.array(z.string().max(100)).optional(),
    schedule: z.object({
      monday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      tuesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      wednesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      thursday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      friday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      saturday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      sunday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
    }).optional(),
    isActive: z.boolean().default(true),
  }),

  update: z.object({
    name: commonSchemas.name.optional(),
    email: z.string().email().max(254).toLowerCase().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    position: z.enum(['VETERINARIAN', 'VETERINARY_TECHNICIAN', 'ASSISTANT', 'RECEPTIONIST', 'MANAGER', 'GROOMER', 'OTHER']).optional(),
    licenseNumber: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    specializations: z.array(z.string().max(100)).optional(),
    schedule: z.object({
      monday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      tuesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      wednesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      thursday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      friday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      saturday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
      sunday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
};

// Payment and billing validation schemas
export const billingSchemas = {
  invoice: z.object({
    customerId: commonSchemas.id,
    items: z.array(z.object({
      description: commonSchemas.safeString,
      quantity: z.number().min(1).max(1000),
      unitPrice: commonSchemas.amount,
      total: commonSchemas.amount,
    })).min(1),
    subtotal: commonSchemas.amount,
    tax: commonSchemas.amount.default(0),
    discount: commonSchemas.amount.default(0),
    total: commonSchemas.amount,
    dueDate: z.string().datetime().optional(),
    notes: commonSchemas.description.optional(),
    currency: commonSchemas.currencyCode.default('USD'),
  }),

  payment: z.object({
    invoiceId: commonSchemas.id,
    amount: commonSchemas.amount,
    method: z.enum(['CASH', 'CARD', 'CHECK', 'BANK_TRANSFER', 'OTHER']),
    reference: z.string().max(100).optional(),
    notes: commonSchemas.description.optional(),
  }),
};

// Inventory validation schemas
export const inventorySchemas = {
  item: z.object({
    name: commonSchemas.safeString,
    description: commonSchemas.description.optional(),
    category: z.enum(['MEDICATION', 'SUPPLIES', 'EQUIPMENT', 'FOOD', 'TOYS', 'OTHER']),
    sku: z.string().max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
    barcode: z.string().max(100).regex(/^[a-zA-Z0-9-]+$/).optional(),
    unit: z.enum(['PIECE', 'BOX', 'BOTTLE', 'VIAL', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'OTHER']),
    costPrice: commonSchemas.amount,
    salePrice: commonSchemas.amount,
    minStock: z.number().min(0).max(10000),
    currentStock: z.number().min(0).max(100000),
    expirationDate: z.string().datetime().optional(),
    supplier: commonSchemas.safeString.optional(),
    isActive: z.boolean().default(true),
  }),

  stockMovement: z.object({
    itemId: commonSchemas.id,
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED']),
    quantity: z.number().min(-10000).max(10000),
    reason: commonSchemas.safeString,
    reference: z.string().max(100).optional(),
    notes: commonSchemas.description.optional(),
  }),
};

/**
 * Validation schema for webhook verification
 */
export const webhookSchemas = {
  stripe: z.object({
    type: z.string(),
    data: z.object({
      object: z.any(),
    }),
    created: z.number(),
    livemode: z.boolean(),
  }),

  whatsapp: z.object({
    object: z.string(),
    entry: z.array(z.any()),
  }),

  n8n: z.object({
    workflowId: z.string(),
    executionId: z.string(),
    data: z.any(),
  }),
};
