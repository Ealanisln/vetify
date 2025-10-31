# Fix: Pet Species and Gender Enum Values

## Problem
The pet creation form was sending Spanish values (`"Perro"`, `"Macho"`, etc.) but the API validation schema expected English values (`"dog"`, `"male"`, etc.), causing validation errors when creating pets.

## Root Cause
- Frontend form (`NewCustomerForm.tsx`) was using Spanish values for species and gender
- Backend validation schema (`lib/pets.ts`) expected English enum values
- Database also contained pets with Spanish values from seed scripts

## Changes Made

### 1. Frontend Form (src/components/customers/NewCustomerForm.tsx)
- ✅ Added mapping functions `mapSpeciesToEnglish()` and `mapGenderToEnglish()`
- ✅ Automatically converts Spanish form values to English before API submission
- ✅ UI remains in Spanish for better user experience

### 2. Seed Scripts
Fixed all seed scripts to use English values:

- ✅ `scripts/seed-test-data.ts` - Changed gender values from Spanish to English
- ✅ `scripts/seed-demo-data.mjs` - Updated all pet records (8 customers, ~15 pets)
- ✅ `scripts/create-test-duplicates.mjs` - Fixed species, gender, and `birthDate` → `dateOfBirth`

### 3. Tests
- ✅ `__tests__/integration/multi-tenancy/data-isolation.test.ts` - Updated test data to use English values

### 4. Database Migration
Created and ran `scripts/fix-pet-enum-values.mjs`:
- ✅ Migrated 108 existing pets from Spanish to English values
- ✅ All pets in database now have correct enum values

## Validation Schema (Reference)
```typescript
species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other'])
gender: z.enum(['male', 'female'])
```

## Display Translation (Already Working)
UI components correctly translate English values to Spanish for display:
- `src/components/pets/PetHeader.tsx` - Shows "Macho"/"Hembra" based on `pet.gender`
- `src/app/dashboard/pets/page.tsx` - Shows appropriate emoji and Spanish labels

## Testing
To verify the fix:
1. Navigate to `/dashboard/customers/new`
2. Add a customer with a pet
3. Fill in pet details (values will be in Spanish in the form)
4. Submit the form
5. ✅ Pet should be created successfully without validation errors

## Future Considerations
- All new pets will be stored with English enum values in the database
- UI will continue to display Spanish labels for better UX
- Any new seed scripts should use English enum values

