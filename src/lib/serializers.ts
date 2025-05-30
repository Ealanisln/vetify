import { Decimal } from '@prisma/client/runtime/library';

/**
 * Converts Prisma Decimal fields to regular numbers for client component serialization
 */
export function serializeDecimal(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toNumber();
}

/**
 * Recursively serializes an object, converting any Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Decimal) {
    return obj.toNumber();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeObject(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Serializes user data with tenant and plan, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeUser(user: any) {
  return serializeObject(user);
}

/**
 * Serializes tenant data with plan, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeTenant(tenant: any) {
  return serializeObject(tenant);
}

/**
 * Serializes a pet object, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePet(pet: any) {
  return serializeObject(pet);
}

/**
 * Serializes an array of pets, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePets(pets: any[]) {
  return serializeObject(pets);
}

/**
 * Serializes a plan object, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePlan(plan: any) {
  return serializeObject(plan);
} 