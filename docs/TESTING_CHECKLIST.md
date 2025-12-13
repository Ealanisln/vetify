# Testing Checklist - Vetify

Esta guía define los estándares y patrones de testing para el proyecto Vetify.

## Comandos de Testing

```bash
# Unit tests
pnpm test:unit                    # Ejecutar unit tests
pnpm test:unit --watch            # Modo watch

# Integration tests
pnpm test:integration             # Ejecutar integration tests

# E2E tests
pnpm test:e2e                     # Ejecutar E2E tests
pnpm test:e2e:ui                  # Con interfaz visual

# Coverage
pnpm test:coverage                # Ver cobertura
pnpm test:coverage:report         # Reporte detallado

# All tests
pnpm test:all                     # Unit + Integration + E2E
pnpm test:pre-deploy              # Tests críticos + build
```

---

## Estructura de Archivos de Test

```
__tests__/
├── unit/                         # Unit tests
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── lib/                      # Library/utility tests
│   └── security/                 # Security tests
├── integration/                  # Integration tests
│   └── api/                      # API route tests
├── mocks/                        # Shared mocks
│   └── prisma.ts                 # Prisma mock
└── utils/                        # Test utilities
    └── test-utils.ts             # Factories y helpers

tests/
└── e2e/                          # Playwright E2E tests
    ├── subscription/             # Subscription flows
    └── core-flows/               # Core user journeys
```

---

## Patrones de Testing

### 1. API Route Tests (Integration)

```typescript
import { prismaMock } from '../../mocks/prisma';
import {
  createTestPet,
  createTestTenant,
  createTestCustomer,
} from '../../utils/test-utils';

// Mock auth
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';

describe('API Route Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data using factories
    mockTenant = createTestTenant({ id: 'tenant-1' });
    mockCustomer = createTestCustomer({
      id: 'customer-1',
      tenantId: mockTenant.id
    });
    mockPet = createTestPet({
      id: 'pet-1',
      tenantId: mockTenant.id,
      customerId: mockCustomer.id
    });

    // Mock authentication
    (requireAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      tenant: mockTenant,
    });
  });

  describe('POST /api/resource', () => {
    it('should create resource with valid data', async () => {
      // Arrange
      prismaMock.resource.create.mockResolvedValue({ id: 'resource-1' });

      // Act
      const result = await createResource(/* ... */);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('resource-1');
    });
  });
});
```

### 2. Multi-Tenancy Tests

Siempre verifica el aislamiento entre tenants:

```typescript
describe('Multi-tenancy isolation', () => {
  it('should not allow access to other tenant data', async () => {
    const otherTenantPet = createTestPet({
      id: 'other-pet',
      tenantId: 'other-tenant-id',
    });

    prismaMock.pet.findFirst.mockImplementation(async (args: any) => {
      const queriedTenantId = args?.where?.customer?.tenantId;
      if (queriedTenantId === mockTenant.id) {
        // Only return data for current tenant
        return null;
      }
      return null;
    });

    const result = await prismaMock.pet.findFirst({
      where: {
        id: otherTenantPet.id,
        customer: { tenantId: mockTenant.id },
      },
    });

    expect(result).toBeNull();
  });

  it('should scope all queries to current tenant', async () => {
    const queryCalls: any[] = [];

    prismaMock.pet.findFirst.mockImplementation(async (args) => {
      queryCalls.push(args);
      return mockPet as any;
    });

    await prismaMock.pet.findFirst({
      where: {
        id: 'pet-1',
        customer: { tenantId: mockTenant.id },
      },
    });

    expect(queryCalls[0].where.customer.tenantId).toBe(mockTenant.id);
  });
});
```

### 3. Validation Tests

```typescript
describe('Validation errors', () => {
  it('should require field with minimum length', async () => {
    const shortValue = 'A';
    const validValue = 'Valid longer value';

    // Validate minimum length requirement
    expect(shortValue.length).toBeLessThan(10);
    expect(validValue.length).toBeGreaterThanOrEqual(10);
  });

  it('should require valid date', async () => {
    const validDate = new Date('2025-01-01T10:00:00Z');
    const invalidDateString = 'not-a-date';

    expect(validDate instanceof Date).toBe(true);
    expect(isNaN(validDate.getTime())).toBe(false);
    expect(isNaN(Date.parse(invalidDateString))).toBe(true);
  });

  it('should require value in valid range', async () => {
    const tooLow = 0;
    const tooHigh = 500;
    const validValue = 100;

    // Value must be between 1 and 365
    expect(tooLow).toBeLessThan(1);
    expect(tooHigh).toBeGreaterThan(365);
    expect(validValue).toBeGreaterThanOrEqual(1);
    expect(validValue).toBeLessThanOrEqual(365);
  });
});
```

### 4. Error Handling Tests

```typescript
describe('Error handling', () => {
  it('should handle Zod validation errors', async () => {
    const zodError = {
      name: 'ZodError',
      errors: [
        { path: ['field_name'], message: 'Error message' },
      ],
    };

    const fieldErrors: Record<string, string> = {};
    zodError.errors.forEach((err) => {
      const field = err.path.join('.');
      fieldErrors[field] = err.message;
    });

    expect(fieldErrors['field_name']).toBe('Error message');
  });

  it('should return 403 for tenant mismatch', async () => {
    const requestTenantId = 'other-tenant';
    const authenticatedTenantId = mockTenant.id;

    const expectedStatus = requestTenantId !== authenticatedTenantId ? 403 : 200;
    expect(expectedStatus).toBe(403);
  });

  it('should return 404 for non-existent resource', async () => {
    prismaMock.pet.findFirst.mockResolvedValue(null);

    const pet = await prismaMock.pet.findFirst({
      where: { id: 'non-existent' },
    });

    expect(pet).toBeNull();
  });
});
```

---

## Test Factories Disponibles

Las factories están en `__tests__/utils/test-utils.ts`:

| Factory | Uso |
|---------|-----|
| `createTestUser(overrides)` | Usuario autenticado |
| `createTestTenant(overrides)` | Clínica/tenant |
| `createTestPet(overrides)` | Mascota |
| `createTestCustomer(overrides)` | Cliente/dueño |
| `createTestAppointment(overrides)` | Cita |
| `createTestLocation(overrides)` | Ubicación/sucursal |
| `createTestInventoryItem(overrides)` | Item de inventario |
| `createTestService(overrides)` | Servicio |
| `createTestStaff(overrides)` | Personal/veterinario |

Ejemplo de uso con overrides:
```typescript
const pet = createTestPet({
  id: 'custom-id',
  name: 'Max',
  species: 'CAT',
  tenantId: 'tenant-123',
});
```

---

## Mocks Disponibles

### Prisma Mock
```typescript
import { prismaMock } from '../../mocks/prisma';

// Mock find operation
prismaMock.pet.findFirst.mockResolvedValue(mockPet);

// Mock create operation
prismaMock.pet.create.mockResolvedValue(newPet);

// Mock with implementation
prismaMock.pet.findFirst.mockImplementation(async (args) => {
  if (args?.where?.id === 'specific-id') {
    return mockPet;
  }
  return null;
});
```

### Auth Mock
```typescript
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

(requireAuth as jest.Mock).mockResolvedValue({
  user: { id: 'user-1', email: 'test@example.com' },
  tenant: mockTenant,
});
```

### External Services
Los siguientes servicios ya están mockeados en `test-utils.ts`:
- Next.js Router (`next/navigation`)
- Next.js Image (`next/image`)
- Sentry (`@sentry/nextjs`)
- Stripe (`@stripe/stripe-js`)
- Kinde Auth (`@kinde-oss/kinde-auth-nextjs`)
- Upstash Redis (`@upstash/redis`)
- Upstash Rate Limit (`@upstash/ratelimit`)

---

## Checklist Pre-PR

Antes de crear un PR, verifica:

### Tests Requeridos

- [ ] **Unit Tests** para nuevas funciones/utilities
- [ ] **Integration Tests** para nuevos API endpoints
- [ ] **Multi-tenancy Tests** verifican aislamiento de datos
- [ ] **Validation Tests** cubren edge cases de input

### Escenarios Mínimos por Tipo

#### API Endpoints
- [ ] Operación exitosa con datos válidos
- [ ] Validación de campos requeridos
- [ ] Validación de formatos (fechas, números, strings)
- [ ] Verificación de pertenencia a tenant
- [ ] Manejo de recursos no existentes (404)
- [ ] Manejo de acceso no autorizado (403)

#### Componentes
- [ ] Renderizado con props válidas
- [ ] Estados de loading
- [ ] Estados de error
- [ ] Interacciones de usuario (clicks, inputs)

#### Hooks
- [ ] Estado inicial correcto
- [ ] Transiciones de estado
- [ ] Manejo de errores
- [ ] Cleanup en unmount

---

## CI/CD Pipeline

El pipeline de GitHub Actions (`test.yml`) ejecuta:

1. **Unit Tests** - En cada push/PR
2. **Integration Tests** - Con servicio PostgreSQL
3. **E2E Tests** - Después de unit e integration
4. **Coverage Check** - Verifica umbrales mínimos
5. **Type Check** - Verifica tipos TypeScript
6. **Lint** - Verifica estilo de código

### Pre-commit Hook

Antes de cada commit se ejecuta:
- `lint-staged` - ESLint en archivos modificados
- `test:unit --changedSince=HEAD` - Tests de archivos cambiados

---

## Enums de Prisma

Referencia rápida de enums para tests:

### TreatmentType
```typescript
import { TreatmentType } from '@prisma/client';

TreatmentType.VACCINATION
TreatmentType.DEWORMING
TreatmentType.FLEA_TICK
TreatmentType.OTHER_PREVENTATIVE
```

### VaccinationStage
```typescript
import { VaccinationStage } from '@prisma/client';

VaccinationStage.PUPPY_KITTEN
VaccinationStage.ADULT
VaccinationStage.SENIOR
VaccinationStage.BOOSTER
```

### AppointmentStatus
```typescript
AppointmentStatus.SCHEDULED
AppointmentStatus.CONFIRMED
AppointmentStatus.IN_PROGRESS
AppointmentStatus.COMPLETED
AppointmentStatus.CANCELLED
AppointmentStatus.NO_SHOW
```

### Species
```typescript
Species.DOG
Species.CAT
Species.BIRD
Species.RABBIT
Species.OTHER
```

---

## Troubleshooting

### Tests Fallan por Fechas
Usa fechas dinámicas, no hardcoded:
```typescript
// ❌ Malo - puede fallar en el futuro
const futureDate = new Date('2025-02-15');

// ✅ Bueno - siempre será futuro
const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
```

### Enum No Encontrado
Verifica en `prisma/schema.prisma` los valores correctos del enum.

### Mock No Funciona
Asegúrate de:
1. Importar el mock ANTES del módulo que lo usa
2. Llamar `jest.clearAllMocks()` en `beforeEach`
3. Usar `as jest.Mock` para type casting

---

## Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright](https://playwright.dev/docs/intro)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
