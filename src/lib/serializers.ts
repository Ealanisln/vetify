/**
 * Converts Prisma Decimal fields to regular numbers for client component serialization
 *
 * Note: These utilities can be used in both server and client components as they only
 * perform data transformation without any server-specific operations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDecimal(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  // Check if it's a Decimal instance without importing the class
  if (value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return value;
}

/**
 * Recursively serializes an object, converting any Decimal fields to numbers
 * Handles Prisma objects, nested objects, arrays, and Date objects
 * Filters out functions to prevent serialization errors with Client Components
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Decimal objects (check for toNumber method without importing class)
  if (obj && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item));
  }

  // Handle plain objects and Prisma model objects
  // We check for 'object' type instead of constructor to handle Prisma models
  if (typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and undefined values to ensure clean serialization
      if (typeof value !== 'function' && value !== undefined) {
        serialized[key] = serializeObject(value);
      }
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
 * Serializes a customer object, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeCustomer(customer: any) {
  return serializeObject(customer);
}

/**
 * Serializes an array of customers, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeCustomers(customers: any[]) {
  return serializeObject(customers);
}

/**
 * Serializes a plan object, converting Decimal fields to numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePlan(plan: any) {
  return serializeObject(plan);
} 