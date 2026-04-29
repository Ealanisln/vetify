# Sistema de Referidos - Vetify

## Descripcion General

Sistema de referidos/afiliados que permite a partners externos referir clinicas veterinarias a Vetify y ganar comisiones por cada conversion (primer pago).

---

## Flujo Completo

```
1. Admin crea un Partner en /admin/referrals
2. Admin genera un codigo de referido (ej: DRSMITH)
3. Partner comparte su link: vetify.pro/api/ref/DRSMITH
4. Clinica hace click → redirect a /precios?ref=DRSMITH + cookie (30 dias)
5. Clinica se registra (onboarding) → ReferralConversion con status SIGNUP
6. Clinica paga su primer suscripcion → status cambia a CONVERTED, comision calculada
7. Admin recibe email de notificacion, partner tambien
8. Admin revisa en /admin/referrals → Aprueba → Marca como Pagado
```

---

## Modelos de Datos

### ReferralPartner
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| name | String | Nombre del partner |
| email | String (unique) | Email de contacto |
| phone | String? | Telefono |
| company | String? | Empresa u organizacion |
| commissionPercent | Decimal(5,2) | Porcentaje de comision (ej: 20.00) |
| isActive | Boolean | Si esta activo |
| notes | Text? | Notas internas del admin |
| createdBy | String? | ID del admin que lo creo |

### ReferralCode
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| code | String (unique) | Codigo en mayusculas (ej: DRSMITH) |
| partnerId | FK → ReferralPartner | Partner dueño del codigo |
| isActive | Boolean | Si el codigo esta activo |
| discountPercent | Int? | Descuento para la clinica referida |
| discountMonths | Int? | Meses que dura el descuento |
| stripeCouponId | String? | Cupon de Stripe si aplica descuento |
| clickCount | Int | Contador de clicks en el link |

### ReferralConversion
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| partnerId | FK → ReferralPartner | Partner que refirio |
| codeId | FK → ReferralCode | Codigo usado |
| tenantId | FK → Tenant | Clinica referida |
| status | Enum | SIGNUP, CONVERTED, CHURNED |
| signedUpAt | DateTime | Fecha de registro |
| convertedAt | DateTime? | Fecha del primer pago |
| planKey | String? | Plan contratado |
| subscriptionAmount | Decimal? | Monto mensual de la suscripcion |
| commissionPercent | Decimal? | % de comision al momento de conversion |
| commissionAmount | Decimal? | Monto de comision calculado |
| payoutStatus | Enum | PENDING, APPROVED, PAID, VOID |
| paidAt | DateTime? | Fecha en que se pago la comision |
| paidBy | String? | Admin que marco como pagado |
| payoutNotes | Text? | Notas del pago |

**Constraint**: Un solo registro por combinacion codigo+tenant (`@@unique([codeId, tenantId])`)

---

## API Endpoints

### Publicos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/ref/[code]` | Redirect a /precios con cookie de atribucion (30 dias) |

### Admin (requieren super admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admin/referrals?includeStats=true` | Listar partners (con stats opcionales) |
| POST | `/api/admin/referrals` | Crear partner |
| GET | `/api/admin/referrals/[id]` | Detalle de partner con codes y conversiones |
| PUT | `/api/admin/referrals/[id]` | Actualizar partner |
| DELETE | `/api/admin/referrals/[id]` | Desactivar partner (soft delete) |
| GET | `/api/admin/referrals/[id]/codes` | Listar codigos de un partner |
| POST | `/api/admin/referrals/[id]/codes` | Crear codigo para un partner |
| GET | `/api/admin/referrals/conversions?status=X&payoutStatus=Y&partnerId=Z` | Listar conversiones con filtros |
| PUT | `/api/admin/referrals/conversions/[id]` | Actualizar estado de pago |
| PUT | `/api/admin/referrals/conversions/bulk` | Actualizar pagos en lote (enviar `conversionIds` en body) |

### Payloads

**Crear partner:**
```json
{
  "name": "Dr. Carlos Martinez",
  "email": "carlos@example.com",
  "phone": "+52 555 123 4567",
  "company": "Consultoría Veterinaria MX",
  "commissionPercent": 20,
  "notes": "Contacto en Guadalajara, Monterrey y CDMX"
}
```

**Crear codigo:**
```json
{
  "code": "DRCARLOS",
  "discountPercent": 10,
  "discountMonths": 3,
  "stripeCouponId": "promo_xxx"
}
```

**Actualizar payout:**
```json
{
  "status": "PAID",
  "notes": "Transferencia bancaria #12345"
}
```

**Bulk payout:**
```json
{
  "status": "PAID",
  "conversionIds": ["uuid1", "uuid2", "uuid3"],
  "notes": "Pago mensual marzo 2026"
}
```

---

## Integracion con Stripe

### Metadata en Subscription
Cuando una clinica referida paga, la suscripcion de Stripe incluye:
```json
{
  "metadata": {
    "referralCodeId": "uuid-del-codigo",
    "referralPartnerId": "uuid-del-partner",
    "tenantId": "uuid-del-tenant",
    "planKey": "PROFESIONAL"
  }
}
```

### Descuento para clinica referida
Si el `ReferralCode` tiene `stripeCouponId`, se aplica automaticamente en el checkout como descuento de Stripe. La prioridad es:
1. Promocion del sistema (SystemPromotion con descuento) — tiene prioridad
2. Descuento del referido — se aplica si no hay promocion activa
3. Codigos manuales de Stripe — se permite si no hay ni promocion ni descuento de referido

### Calculo de Comision
En el webhook `invoice.payment_succeeded`:
1. Se detecta `referralCodeId` en metadata de la suscripcion
2. Se busca la conversion con status SIGNUP para ese tenant
3. Se calcula: `commissionAmount = (invoice.amount_paid / 100) * partner.commissionPercent / 100`
4. Se guarda snapshot del porcentaje y monto en la conversion

---

## Notificaciones Email

| Evento | Destinatario | Contenido |
|--------|-------------|-----------|
| Conversion (primer pago) | Admin | Partner, codigo, clinica, plan, monto suscripcion, comision calculada |
| Conversion (primer pago) | Partner | Nombre de clinica, monto de comision |

Las notificaciones se envian via Resend y son no-bloqueantes (no fallan el webhook si hay error de envio).

---

## Panel Admin (/admin/referrals)

### Stats Cards
- Partners Activos (de X total)
- Conversiones (con tasa de conversion)
- Comisiones Pendientes ($)
- Total Pagado ($)

### Tab: Partners
Tabla con: nombre, email, empresa, % comision, codigos activos, conversiones, estado.
Acciones: ver detalle, editar.

### Tab: Conversiones
Tabla con: clinica, partner, codigo, fecha, estado, comision, pago.
Filtros: por estado (SIGNUP/CONVERTED/CHURNED), por pago (PENDING/APPROVED/PAID/VOID).
Acciones: aprobar pago, marcar como pagado.

### Detalle de Partner
- Info del partner con metricas (comision total, pendiente)
- Lista de codigos con clicks
- Historial de conversiones con acciones de pago

### Formulario de Partner
- Crear/editar partner (nombre, email, telefono, empresa, comision, notas)
- Agregar codigos de referido (solo al editar)

---

## Link de Referido

### URL
```
https://vetify.pro/api/ref/DRSMITH
```

### Comportamiento
1. Valida que el codigo exista y este activo
2. Incrementa contador de clicks
3. Setea cookie `vetify_ref=DRSMITH` (30 dias, httpOnly=false para leerla en JS)
4. Redirect a `/precios?ref=DRSMITH`

### Atribucion
El onboarding lee `referralCode` del body del request. El frontend debe:
1. Leer el query param `ref` de la URL en /precios
2. O leer la cookie `vetify_ref`
3. Enviar como `referralCode` en el POST a `/api/onboarding`

---

## Archivos del Feature

```
prisma/schema.prisma                                    # Modelos + enums
src/lib/referrals/queries.ts                           # CRUD y logica de negocio
src/lib/email/referral-notifications.ts                # Emails a admin y partner
src/app/api/ref/[code]/route.ts                        # Link publico de referido
src/app/api/admin/referrals/route.ts                   # GET/POST partners
src/app/api/admin/referrals/[id]/route.ts              # GET/PUT/DELETE partner
src/app/api/admin/referrals/[id]/codes/route.ts        # GET/POST codes
src/app/api/admin/referrals/conversions/route.ts       # GET conversiones
src/app/api/admin/referrals/conversions/[id]/route.ts  # PUT payout status
src/app/admin/referrals/page.tsx                       # Pagina admin
src/components/admin/referrals/ReferralsManager.tsx    # Manager principal
src/components/admin/referrals/PartnersList.tsx        # Tabla de partners
src/components/admin/referrals/PartnerForm.tsx         # Form crear/editar
src/components/admin/referrals/PartnerDetail.tsx       # Detalle + payouts
src/components/admin/referrals/ConversionsList.tsx     # Tabla de conversiones
```

### Archivos modificados
```
src/app/api/onboarding/route.ts          # Acepta referralCode
src/app/api/checkout/route.ts            # Pasa referralCode a Stripe
src/lib/payments/stripe.ts               # Metadata + descuento referral
src/app/api/stripe/webhook/route.ts      # Tracking de conversion + emails
src/components/admin/AdminSidebar.tsx     # Nav "Referidos"
```

---

## Migracion

```bash
pnpm prisma migrate dev --name add-referral-system
```

---

## Fase 2 (Futuro)

Cuando el programa de referidos funcione y haya multiples partners:

- **Dashboard self-service** para partners en `/partner/*`
- **Stripe Connect** para pagos automaticos de comisiones
- **Comisiones por niveles** (Standard → Silver → Gold → Platinum)
- **Cron mensual** de pagos automaticos
- **Analytics** con graficas de funnel y leaderboard
- **UTM tracking** mejorado con landing pages personalizadas
