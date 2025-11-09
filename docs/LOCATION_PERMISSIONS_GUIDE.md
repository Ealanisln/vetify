# Location-Based Permissions Guide

This guide explains how to implement location-based access control in Vetify for multi-clinic scenarios.

## Overview

Location-based permissions ensure that staff members can only access resources (pets, appointments, customers, etc.) that belong to locations they are assigned to. This is implemented through the `StaffLocation` junction table and helper functions in `src/lib/locations.ts`.

## Core Concepts

### Staff-Location Assignments

- Staff members can be assigned to multiple locations
- Each staff member has one primary location
- Access control is enforced at the query level, not in middleware
- Backwards compatible: resources without location are accessible to all staff

### Permission Model

```
Tenant (Multi-Clinic)
  ├── Location A
  │   ├── Staff Member 1 (primary: true)
  │   └── Staff Member 2
  ├── Location B
  │   └── Staff Member 1
  └── Location C
      └── Staff Member 3 (primary: true)
```

Staff Member 1 can access resources in Location A and B.
Staff Member 3 can only access resources in Location C.

## Available Helper Functions

### 1. Get Staff's Location IDs

```typescript
import { getStaffLocationIds } from '@/lib/locations';

// Get all location IDs a staff member can access
const locationIds = await getStaffLocationIds(staffId);
// Returns: ['loc-id-1', 'loc-id-2']
```

### 2. Get Primary Location

```typescript
import { getStaffPrimaryLocationId } from '@/lib/locations';

// Get staff member's primary location
const primaryLocationId = await getStaffPrimaryLocationId(staffId);
// Returns: 'loc-id-1' or null
```

### 3. Check Location Access

```typescript
import { staffHasAccessToLocation } from '@/lib/locations';

// Check if staff can access a specific location
const hasAccess = await staffHasAccessToLocation(staffId, locationId);
// Returns: true or false
```

### 4. Require Location Access (Throws Error)

```typescript
import { requireLocationAccess } from '@/lib/locations';

// Validate access and throw error if denied
await requireLocationAccess(staffId, pet.locationId, 'pet');
// Throws: "Access denied: This pet belongs to a location you don't have access to"
```

### 5. Filter Queries by Staff Locations

```typescript
import { filterByStaffLocations } from '@/lib/locations';

// Filter Prisma queries to only include staff's assigned locations
const pets = await prisma.pet.findMany({
  where: {
    tenantId,
    ...await filterByStaffLocations(staffId, 'locationId'),
  },
});
```

## Implementation Examples

### Example 1: Filter Pet List by Staff Locations

```typescript
// src/app/api/pets/route.ts
import { requireAuth } from '@/lib/auth';
import { filterByStaffLocations } from '@/lib/locations';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { user, tenant } = await requireAuth();

  // Get user's staff record
  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, tenantId: tenant.id }
  });

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  }

  // Fetch pets filtered by staff's assigned locations
  const pets = await prisma.pet.findMany({
    where: {
      tenantId: tenant.id,
      ...await filterByStaffLocations(staff.id, 'locationId'),
    },
    include: {
      customer: true,
      location: true,
    },
  });

  return NextResponse.json(pets);
}
```

### Example 2: Validate Access Before Updating Resource

```typescript
// src/app/api/pets/[id]/route.ts
import { requireAuth } from '@/lib/auth';
import { requireLocationAccess } from '@/lib/locations';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, tenant } = await requireAuth();
  const { id } = await context.params;

  // Get user's staff record
  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, tenantId: tenant.id }
  });

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  }

  // Get the pet
  const pet = await prisma.pet.findFirst({
    where: { id, tenantId: tenant.id },
  });

  if (!pet) {
    return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
  }

  // Validate staff has access to pet's location
  try {
    await requireLocationAccess(staff.id, pet.locationId, 'pet');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }

  // Proceed with update
  const body = await request.json();
  const updatedPet = await prisma.pet.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updatedPet);
}
```

### Example 3: Filter Appointments in Server Component

```typescript
// src/app/dashboard/appointments/page.tsx
import { requireAuth } from '@/lib/auth';
import { filterByStaffLocations } from '@/lib/locations';
import { prisma } from '@/lib/prisma';

export default async function AppointmentsPage() {
  const { user, tenant } = await requireAuth();

  // Get user's staff record
  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, tenantId: tenant.id }
  });

  // Fetch appointments filtered by staff's assigned locations
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      ...await filterByStaffLocations(staff!.id, 'locationId'),
    },
    include: {
      pet: true,
      location: true,
    },
    orderBy: { dateTime: 'desc' },
  });

  return <AppointmentsList appointments={appointments} />;
}
```

### Example 4: Create Resource with Staff's Primary Location

```typescript
// src/app/api/pets/route.ts
import { requireAuth } from '@/lib/auth';
import { getStaffPrimaryLocationId } from '@/lib/locations';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { user, tenant } = await requireAuth();
  const body = await request.json();

  // Get user's staff record
  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, tenantId: tenant.id }
  });

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  }

  // Get staff's primary location (or first assigned location)
  const primaryLocationId = await getStaffPrimaryLocationId(staff.id);

  // Use provided location or default to staff's primary location
  const locationId = body.locationId || primaryLocationId;

  const pet = await prisma.pet.create({
    data: {
      ...body,
      tenantId: tenant.id,
      locationId,
    },
  });

  return NextResponse.json(pet);
}
```

## Best Practices

### 1. Always Check Staff Record

```typescript
// Get staff record for current user
const staff = await prisma.staff.findFirst({
  where: { userId: user.id, tenantId: tenant.id }
});

if (!staff) {
  return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
}
```

### 2. Use Filter Helper for List Endpoints

For endpoints that return lists of resources, always use `filterByStaffLocations`:

```typescript
const resources = await prisma.resource.findMany({
  where: {
    tenantId,
    ...await filterByStaffLocations(staffId, 'locationId'),
  },
});
```

### 3. Validate Access for Detail/Update/Delete Endpoints

For endpoints that operate on a single resource, use `requireLocationAccess`:

```typescript
await requireLocationAccess(staffId, resource.locationId, 'resource type');
```

### 4. Default to Primary Location for New Resources

When creating resources, default to the staff member's primary location:

```typescript
const locationId = body.locationId || await getStaffPrimaryLocationId(staffId);
```

### 5. Handle Backwards Compatibility

Resources without location are accessible to all staff (graceful degradation):

```typescript
// requireLocationAccess allows null locationId
await requireLocationAccess(staffId, resource.locationId, 'resource');
// Won't throw error if resource.locationId is null
```

## Resources Requiring Location Permissions

Apply location-based permissions to these resources:

- ✅ Pets (`pet.locationId`)
- ✅ Appointments (`appointment.locationId`)
- ✅ Customers (`customer.locationId`)
- ✅ Inventory Items (`inventoryItem.locationId`)
- ✅ Cash Drawers (`cashDrawer.locationId`)
- ⚠️ Medical Histories (via `pet.locationId`)
- ⚠️ Sales (via `sale.locationId`)

## Testing Location Permissions

### Unit Test Example

```typescript
import { getStaffLocationIds, requireLocationAccess } from '@/lib/locations';

describe('Location Permissions', () => {
  it('should return staff location IDs', async () => {
    const locationIds = await getStaffLocationIds('staff-id');
    expect(locationIds).toContain('loc-1');
  });

  it('should throw error for unauthorized access', async () => {
    await expect(
      requireLocationAccess('staff-id', 'unauthorized-loc-id', 'pet')
    ).rejects.toThrow('Access denied');
  });
});
```

### Manual Test Checklist

1. ✅ Staff can view resources from assigned locations
2. ✅ Staff cannot view resources from unassigned locations
3. ✅ Staff can create resources in assigned locations
4. ✅ Staff cannot update resources in unassigned locations
5. ✅ Primary location is used as default for new resources
6. ✅ Resources without location are accessible (backwards compatibility)

## Migration Strategy

When rolling out location-based permissions:

1. **Phase 1**: Add location helpers (done)
2. **Phase 2**: Update API routes to filter by location
3. **Phase 3**: Add location UI to existing resources
4. **Phase 4**: Enforce location permissions in all endpoints
5. **Phase 5**: Backfill location data for existing resources

## Troubleshooting

### Staff Can't See Any Resources

**Problem**: Staff member has no location assignments.

**Solution**: Assign staff to at least one location in Staff Management.

### Getting "Access Denied" Errors

**Problem**: Staff trying to access resource from unassigned location.

**Solution**: Either assign staff to that location or move resource to assigned location.

### Performance Issues with Location Filtering

**Problem**: Query is slow due to location filtering.

**Solution**: Ensure database indexes exist on `locationId` fields:

```sql
CREATE INDEX idx_pets_location ON "Pet"("locationId");
CREATE INDEX idx_appointments_location ON "Appointment"("locationId");
CREATE INDEX idx_customers_location ON "Customer"("locationId");
```

## Additional Resources

- [Multi-Location Implementation Guide](./MULTI_LOCATION_IMPLEMENTATION.md)
- [StaffLocation API Documentation](../src/app/api/staff/[staffId]/locations/route.ts)
- [Location Management UI](../src/components/locations/)
