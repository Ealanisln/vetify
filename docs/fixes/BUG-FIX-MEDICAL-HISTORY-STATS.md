# Bug Fix: Medical History Stats Not Displaying

## Issue Summary
**Environment:** Development (https://development.vetify.pro/dashboard/medical-history)
**Severity:** High
**Type:** Data Contract Mismatch

The statistics cards on the Medical History page are showing zeros (0, 0, 0.0, 0) instead of the actual data from the database.

## Root Cause Analysis

### The Problem
There is a **data contract mismatch** between what the API returns and what the frontend component expects.

### API Response Structure
File: `src/lib/medical-history.ts:285-345` (`getMedicalHistoryStats`)

Returns:
```typescript
{
  today: number,          // Consultas de hoy
  thisMonth: number,      // Consultas del mes
  total: number,          // Total de consultas
  commonDiagnoses: Array<{
    diagnosis: string | null,
    count: number
  }>
}
```

### Frontend Expected Structure
File: `src/components/medical/MedicalHistoryStats.tsx:14-19`

Expects:
```typescript
{
  totalHistories: number,     // ❌ API returns 'total' not 'totalHistories'
  thisMonth: number,          // ✅ Matches
  commonDiagnoses: string[],  // ❌ API returns objects with {diagnosis, count}, not strings
  avgVisitsPerPet: number     // ❌ API doesn't return this at all
}
```

### Specific Mismatches

1. **`totalHistories` vs `total`**
   - Component expects: `stats.totalHistories`
   - API returns: `stats.total`
   - Impact: "Total Consultas" shows 0

2. **`commonDiagnoses` structure**
   - Component expects: `string[]` (array of diagnosis names)
   - API returns: `Array<{ diagnosis: string | null, count: number }>`
   - Impact: "Diagnósticos Comunes" count shows 0, no diagnoses displayed

3. **Missing `avgVisitsPerPet`**
   - Component expects: `stats.avgVisitsPerPet` (calculated average)
   - API returns: nothing
   - Impact: "Promedio por Mascota" shows 0.0

4. **Unused `today` field**
   - API returns `today` but component doesn't use it
   - Could be useful for a "Hoy" stat card

## Solution Strategy

### Option 1: Update API to Match Component (Recommended)
✅ **Pros:**
- Single source of truth
- Better API naming (`totalHistories` is clearer than `total`)
- Adds missing calculation (`avgVisitsPerPet`)
- Proper data transformation

❌ **Cons:**
- Requires backend changes
- Need to add pet count query for average calculation

### Option 2: Update Component to Match API
❌ **Pros:**
- Quick fix
- No backend changes

❌ **Cons:**
- Less semantic naming
- Component has to do data transformation
- Still missing `avgVisitsPerPet` calculation

**Decision: Go with Option 1** - Update the API for better long-term maintainability.

## Implementation Plan

### Step 1: Update `getMedicalHistoryStats` Function
**File:** `src/lib/medical-history.ts:285-345`

Changes needed:
1. Rename `total` to `totalHistories` for clarity
2. Transform `commonDiagnoses` from objects to string array
3. Add `avgVisitsPerPet` calculation
4. Optional: Keep `today` or add as separate stat

```typescript
export async function getMedicalHistoryStats(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [
    todayConsultations,
    monthConsultations,
    totalConsultations,
    totalPets,          // NEW: Count total pets with medical history
    commonDiagnosesRaw
  ] = await Promise.all([
    // Consultas de hoy
    prisma.medicalHistory.count({
      where: {
        tenantId,
        visitDate: { gte: today, lt: tomorrow }
      }
    }),

    // Consultas del mes
    prisma.medicalHistory.count({
      where: {
        tenantId,
        visitDate: { gte: thisMonth, lt: nextMonth }
      }
    }),

    // Total de consultas
    prisma.medicalHistory.count({
      where: { tenantId }
    }),

    // NEW: Count unique pets with medical history
    prisma.medicalHistory.findMany({
      where: { tenantId },
      select: { petId: true },
      distinct: ['petId']
    }).then(pets => pets.length),

    // Diagnósticos más comunes
    prisma.medicalHistory.groupBy({
      by: ['diagnosis'],
      where: {
        tenantId,
        diagnosis: { not: null }
      },
      _count: {
        diagnosis: true
      },
      orderBy: {
        _count: {
          diagnosis: 'desc'
        }
      },
      take: 5
    })
  ]);

  // Calculate average visits per pet
  const avgVisitsPerPet = totalPets > 0
    ? totalConsultations / totalPets
    : 0;

  // Transform commonDiagnoses to string array
  const commonDiagnoses = commonDiagnosesRaw
    .map(item => item.diagnosis)
    .filter((diagnosis): diagnosis is string => diagnosis !== null);

  return {
    totalHistories: totalConsultations,  // RENAMED from 'total'
    thisMonth: monthConsultations,
    avgVisitsPerPet,                     // NEW: calculated average
    commonDiagnoses                      // TRANSFORMED to string[]
  };
}
```

### Step 2: Update TypeScript Type Definition
**File:** `src/components/medical/MedicalHistoryStats.tsx:14-19`

Verify the interface matches (should already be correct):
```typescript
interface MedicalStats {
  totalHistories: number;
  thisMonth: number;
  commonDiagnoses: string[];
  avgVisitsPerPet: number;
}
```

### Step 3: Verify API Route
**File:** `src/app/api/medical-history/route.ts:37-40`

No changes needed - already correctly calling `getMedicalHistoryStats`:
```typescript
if (action === 'stats') {
  const stats = await getMedicalHistoryStats(userWithTenant.tenant.id);
  return NextResponse.json(stats);
}
```

### Step 4: Testing

#### Manual Testing
1. Start dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000/dashboard/medical-history`
3. Verify all 4 stat cards display correct values:
   - Total Consultas: Shows total count
   - Este Mes: Shows current month count
   - Promedio por Mascota: Shows calculated average (with 1 decimal)
   - Diagnósticos Comunes: Shows count and displays top 2 diagnoses

#### Test with Different Data States
- Empty state (no medical histories): All should show 0
- With data: Should show correct counts and calculations
- With diagnoses: Should display top 2 common diagnoses

#### Edge Cases to Test
- Division by zero: `avgVisitsPerPet` when no pets
- Null diagnoses: Should be filtered out
- Single pet with multiple visits: Average should calculate correctly

### Step 5: Clean Up (Optional)
Consider if `today` stat should be used:
- Add a 4th row with "Consultas de Hoy" card, OR
- Remove `today` calculation if not needed

## Files to Modify

1. **`src/lib/medical-history.ts`** (Primary change)
   - Lines 285-345: `getMedicalHistoryStats` function
   - Update return object structure
   - Add `avgVisitsPerPet` calculation
   - Transform `commonDiagnoses` to string array

2. **`src/components/medical/MedicalHistoryStats.tsx`** (Verification only)
   - Lines 14-19: Interface already correct
   - Lines 47-76: Component already using correct field names

3. **`src/app/api/medical-history/route.ts`** (No changes)
   - Already correctly implemented

## Testing Checklist

- [ ] TypeScript compilation passes (`pnpm build`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test:unit`)
- [ ] Manual verification in browser
- [ ] Stats display correctly with existing data
- [ ] Stats show 0 when no data exists
- [ ] Average calculation is correct
- [ ] Common diagnoses display properly
- [ ] No console errors in browser
- [ ] Network tab shows API returning correct structure

## Expected Outcome

After fix:
```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│   Total Consultas       │      Este Mes           │  Promedio por Mascota   │  Diagnósticos Comunes   │
│         42              │          8              │         3.5             │          12             │
│   📄 Blue icon          │  📅 Green icon          │  ❤️ Red icon            │  📊 Purple icon         │
│                         │                         │                         │  • Gastroenteritis      │
│                         │                         │                         │  • Otitis Externa       │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

## Potential Future Improvements

1. Add "Consultas de Hoy" stat card using the existing `today` calculation
2. Add caching for stats (Redis/in-memory) to improve performance
3. Add date range filter for stats
4. Add more detailed breakdown (by species, by condition, etc.)
5. Add trend indicators (↑↓) comparing to previous period

## Related Files Reference

- Page component: `src/app/dashboard/medical-history/page.tsx:1-52`
- Stats component: `src/components/medical/MedicalHistoryStats.tsx:1-117`
- API route: `src/app/api/medical-history/route.ts:13-83`
- Library function: `src/lib/medical-history.ts:285-345`

## Issue Creation for Plane

**Title:** Fix Medical History Stats - Data Contract Mismatch

**Labels:** bug, backend, frontend, high-priority

**Description:**
Statistics cards on the Medical History page (/dashboard/medical-history) are displaying zeros instead of actual data due to API/frontend data contract mismatch.

**Affected Files:**
- src/lib/medical-history.ts
- src/components/medical/MedicalHistoryStats.tsx

**Fix:** Update getMedicalHistoryStats to return proper data structure with avgVisitsPerPet calculation and transformed commonDiagnoses array.
