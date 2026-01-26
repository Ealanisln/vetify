# Checklist Manual - Feature de Citas (Appointments)

**Fecha de prueba:** _______________
**Probado por:** _______________
**Versión:** _______________
**Ambiente:** [ ] localhost [ ] development [ ] staging

---

## Pre-requisitos

- [ ] Usuario autenticado con permisos `appointments:read` y `appointments:write`
- [ ] Al menos 1 cliente creado en el sistema
- [ ] Al menos 1 mascota asociada a un cliente
- [ ] Al menos 1 miembro del staff registrado
- [ ] Servidor corriendo correctamente

---

## 1. Crear Cita

### 1.1 Flujo Normal

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 1.1.1 | Ir a `/dashboard/appointments` carga correctamente | [ ] | [ ] | [ ] | |
| 1.1.2 | Click en "Nueva Cita" abre el formulario | [ ] | [ ] | [ ] | |
| 1.1.3 | Seleccionar cliente carga sus mascotas | [ ] | [ ] | [ ] | |
| 1.1.4 | Seleccionar mascota del cliente funciona | [ ] | [ ] | [ ] | |
| 1.1.5 | Seleccionar fecha futura (no domingo) | [ ] | [ ] | [ ] | |
| 1.1.6 | Solo muestra horarios 8am-6pm (excepto 1-2pm) | [ ] | [ ] | [ ] | |
| 1.1.7 | Seleccionar horario disponible | [ ] | [ ] | [ ] | |
| 1.1.8 | Seleccionar duración (15-300 min) | [ ] | [ ] | [ ] | |
| 1.1.9 | Ingresar razón (1-500 chars) | [ ] | [ ] | [ ] | |
| 1.1.10 | Asignar staff (opcional) | [ ] | [ ] | [ ] | |
| 1.1.11 | Agregar notas (opcional) | [ ] | [ ] | [ ] | |
| 1.1.12 | Guardar crea cita con status `SCHEDULED` | [ ] | [ ] | [ ] | |
| 1.1.13 | Cita aparece en calendario | [ ] | [ ] | [ ] | |

### 1.2 Validaciones

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 1.2.1 | Fecha pasada: no permite seleccionar | [ ] | [ ] | [ ] | |
| 1.2.2 | Domingo: no permite seleccionar | [ ] | [ ] | [ ] | |
| 1.2.3 | Horario fuera de rango: no aparece | [ ] | [ ] | [ ] | |
| 1.2.4 | Razón vacía: muestra error | [ ] | [ ] | [ ] | |
| 1.2.5 | Razón > 500 chars: muestra error | [ ] | [ ] | [ ] | |
| 1.2.6 | Notas > 1000 chars: muestra error | [ ] | [ ] | [ ] | |
| 1.2.7 | Conflicto de staff: muestra error | [ ] | [ ] | [ ] | |

### 1.3 Notificaciones

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 1.3.1 | Cliente recibe email de confirmación | [ ] | [ ] | [ ] | |
| 1.3.2 | Staff recibe notificación (si asignado) | [ ] | [ ] | [ ] | |

---

## 2. Ver Citas

### 2.1 Vista de Calendario

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 2.1.1 | Vista diaria funciona | [ ] | [ ] | [ ] | |
| 2.1.2 | Vista semanal funciona | [ ] | [ ] | [ ] | |
| 2.1.3 | Vista mensual funciona | [ ] | [ ] | [ ] | |
| 2.1.4 | Vista de lista funciona | [ ] | [ ] | [ ] | |
| 2.1.5 | Navegación entre fechas funciona | [ ] | [ ] | [ ] | |
| 2.1.6 | Citas muestran color según status | [ ] | [ ] | [ ] | |

### 2.2 Vista de Detalle

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 2.2.1 | Click en cita abre detalle | [ ] | [ ] | [ ] | |
| 2.2.2 | Muestra cliente correctamente | [ ] | [ ] | [ ] | |
| 2.2.3 | Muestra mascota correctamente | [ ] | [ ] | [ ] | |
| 2.2.4 | Muestra fecha/hora correctamente | [ ] | [ ] | [ ] | |
| 2.2.5 | Muestra duración correctamente | [ ] | [ ] | [ ] | |
| 2.2.6 | Muestra razón y notas | [ ] | [ ] | [ ] | |
| 2.2.7 | Muestra staff asignado | [ ] | [ ] | [ ] | |
| 2.2.8 | Muestra status actual | [ ] | [ ] | [ ] | |
| 2.2.9 | Muestra acciones según status | [ ] | [ ] | [ ] | |

### 2.3 Filtros

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 2.3.1 | Filtrar por rango de fechas | [ ] | [ ] | [ ] | |
| 2.3.2 | Filtrar por status | [ ] | [ ] | [ ] | |
| 2.3.3 | Filtrar por ubicación | [ ] | [ ] | [ ] | |

### 2.4 Estadísticas

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 2.4.1 | Citas de hoy es correcto | [ ] | [ ] | [ ] | |
| 2.4.2 | Citas de esta semana es correcto | [ ] | [ ] | [ ] | |
| 2.4.3 | Citas de este mes es correcto | [ ] | [ ] | [ ] | |
| 2.4.4 | Porcentaje completadas es correcto | [ ] | [ ] | [ ] | |

---

## 3. Editar Cita

### 3.1 Modificaciones Permitidas

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 3.1.1 | Cambiar fecha/hora funciona | [ ] | [ ] | [ ] | |
| 3.1.2 | Envía email de reprogramación | [ ] | [ ] | [ ] | |
| 3.1.3 | Cambiar duración funciona | [ ] | [ ] | [ ] | |
| 3.1.4 | Cambiar razón funciona | [ ] | [ ] | [ ] | |
| 3.1.5 | Cambiar notas funciona | [ ] | [ ] | [ ] | |
| 3.1.6 | Cambiar staff funciona | [ ] | [ ] | [ ] | |
| 3.1.7 | Guardar actualiza correctamente | [ ] | [ ] | [ ] | |

### 3.2 Validaciones en Edición

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 3.2.1 | No permite fecha pasada | [ ] | [ ] | [ ] | |
| 3.2.2 | Valida conflictos de staff | [ ] | [ ] | [ ] | |
| 3.2.3 | Valida horarios de negocio | [ ] | [ ] | [ ] | |

---

## 4. Transiciones de Status

### 4.1 Desde SCHEDULED

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 4.1.1 | Confirmar → `CONFIRMED` | [ ] | [ ] | [ ] | |
| 4.1.2 | Cancelar (cliente) → `CANCELLED_CLIENT` | [ ] | [ ] | [ ] | |
| 4.1.3 | Cancelar (clínica) → `CANCELLED_CLINIC` | [ ] | [ ] | [ ] | |

### 4.2 Desde CONFIRMED

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 4.2.1 | Check-in → `CHECKED_IN` | [ ] | [ ] | [ ] | |
| 4.2.2 | No Show → `NO_SHOW` | [ ] | [ ] | [ ] | |
| 4.2.3 | Cancelar → `CANCELLED_*` | [ ] | [ ] | [ ] | |

### 4.3 Desde CHECKED_IN

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 4.3.1 | Iniciar → `IN_PROGRESS` | [ ] | [ ] | [ ] | |
| 4.3.2 | Cancelar → `CANCELLED_CLINIC` | [ ] | [ ] | [ ] | |

### 4.4 Desde IN_PROGRESS

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 4.4.1 | Completar → `COMPLETED` | [ ] | [ ] | [ ] | |
| 4.4.2 | Cancelar → `CANCELLED_CLINIC` | [ ] | [ ] | [ ] | |

### 4.5 Estados Finales (sin acciones)

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 4.5.1 | `COMPLETED` no tiene acciones | [ ] | [ ] | [ ] | |
| 4.5.2 | `CANCELLED_CLIENT` no tiene acciones | [ ] | [ ] | [ ] | |
| 4.5.3 | `CANCELLED_CLINIC` no tiene acciones | [ ] | [ ] | [ ] | |
| 4.5.4 | `NO_SHOW` no tiene acciones | [ ] | [ ] | [ ] | |

---

## 5. Cancelar Cita

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 5.1 | Diálogo de confirmación aparece | [ ] | [ ] | [ ] | |
| 5.2 | Status cambia a `CANCELLED_CLINIC` | [ ] | [ ] | [ ] | |
| 5.3 | Cita NO se elimina (soft delete) | [ ] | [ ] | [ ] | |
| 5.4 | Notas incluyen timestamp | [ ] | [ ] | [ ] | |
| 5.5 | Cliente recibe email de cancelación | [ ] | [ ] | [ ] | |
| 5.6 | Horario queda libre para nuevas citas | [ ] | [ ] | [ ] | |

---

## 6. Disponibilidad de Horarios

### 6.1 Verificar Slots

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 6.1.1 | Solo muestra 8am-6pm | [ ] | [ ] | [ ] | |
| 6.1.2 | Excluye almuerzo (1pm-2pm) | [ ] | [ ] | [ ] | |
| 6.1.3 | Slots son de 15 minutos | [ ] | [ ] | [ ] | |
| 6.1.4 | No muestra horarios ocupados | [ ] | [ ] | [ ] | |
| 6.1.5 | No muestra horarios pasados (hoy) | [ ] | [ ] | [ ] | |

### 6.2 Conflictos de Staff

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 6.2.1 | Staff con cita: horario no disponible | [ ] | [ ] | [ ] | |
| 6.2.2 | Otros staff pueden usar mismo horario | [ ] | [ ] | [ ] | |

---

## 7. Widget "Citas de Hoy"

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 7.1 | Muestra solo citas del día actual | [ ] | [ ] | [ ] | |
| 7.2 | Ordenadas por hora | [ ] | [ ] | [ ] | |
| 7.3 | Muestra cliente y mascota | [ ] | [ ] | [ ] | |
| 7.4 | Muestra hora y duración | [ ] | [ ] | [ ] | |
| 7.5 | Botones de acción rápida funcionan | [ ] | [ ] | [ ] | |
| 7.6 | Botón WhatsApp genera mensaje correcto | [ ] | [ ] | [ ] | |

---

## 8. Notificaciones por Email

### 8.1 Confirmación

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 8.1.1 | Se envía al crear cita | [ ] | [ ] | [ ] | |
| 8.1.2 | Contiene detalles de la cita | [ ] | [ ] | [ ] | |

### 8.2 Recordatorio

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 8.2.1 | Se envía antes de la cita | [ ] | [ ] | [ ] | |
| 8.2.2 | Contiene fecha, hora, ubicación | [ ] | [ ] | [ ] | |

### 8.3 Cancelación

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 8.3.1 | Se envía al cancelar | [ ] | [ ] | [ ] | |
| 8.3.2 | Indica razón si aplica | [ ] | [ ] | [ ] | |

### 8.4 Reprogramación

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 8.4.1 | Se envía al cambiar fecha/hora | [ ] | [ ] | [ ] | |
| 8.4.2 | Muestra nueva fecha/hora | [ ] | [ ] | [ ] | |

---

## 9. Seguridad y Permisos

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 9.1 | Sin `appointments:read` no puede ver | [ ] | [ ] | [ ] | |
| 9.2 | Sin `appointments:write` no puede crear | [ ] | [ ] | [ ] | |
| 9.3 | Sin `appointments:write` no puede editar | [ ] | [ ] | [ ] | |
| 9.4 | Sin `appointments:write` no puede cancelar | [ ] | [ ] | [ ] | |
| 9.5 | No puede ver citas de otro tenant | [ ] | [ ] | [ ] | |
| 9.6 | No puede editar citas de otro tenant | [ ] | [ ] | [ ] | |

---

## 10. Responsive / UX

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 10.1 | Calendario funciona en móvil | [ ] | [ ] | [ ] | |
| 10.2 | Modal se ve bien en móvil | [ ] | [ ] | [ ] | |
| 10.3 | Formulario navegable con teclado | [ ] | [ ] | [ ] | |
| 10.4 | Mensajes de error son claros | [ ] | [ ] | [ ] | |
| 10.5 | Loading states se muestran | [ ] | [ ] | [ ] | |
| 10.6 | Toast notifications aparecen | [ ] | [ ] | [ ] | |

---

## 11. Casos Edge

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 11.1 | Cita último minuto del día (5:45pm) | [ ] | [ ] | [ ] | |
| 11.2 | Cita de 5 horas (máximo) | [ ] | [ ] | [ ] | |
| 11.3 | Cliente sin mascotas no permite cita | [ ] | [ ] | [ ] | |
| 11.4 | Staff sin disponibilidad muestra mensaje | [ ] | [ ] | [ ] | |

---

## 12. Dark Mode

| # | Test | Pass | Fail | N/A | Notas |
|---|------|:----:|:----:|:---:|-------|
| 12.1 | Calendario se ve bien | [ ] | [ ] | [ ] | |
| 12.2 | Modal tiene bordes correctos | [ ] | [ ] | [ ] | |
| 12.3 | Formularios son legibles | [ ] | [ ] | [ ] | |
| 12.4 | Status colors son visibles | [ ] | [ ] | [ ] | |

---

## Resumen de Resultados

| Sección | Total | Pass | Fail | N/A | % |
|---------|-------|------|------|-----|---|
| 1. Crear Cita | 22 | | | | |
| 2. Ver Citas | 19 | | | | |
| 3. Editar Cita | 10 | | | | |
| 4. Transiciones Status | 13 | | | | |
| 5. Cancelar Cita | 6 | | | | |
| 6. Disponibilidad | 7 | | | | |
| 7. Widget Hoy | 6 | | | | |
| 8. Emails | 8 | | | | |
| 9. Seguridad | 6 | | | | |
| 10. Responsive/UX | 6 | | | | |
| 11. Casos Edge | 4 | | | | |
| 12. Dark Mode | 4 | | | | |
| **TOTAL** | **111** | | | | |

---

## Bugs Encontrados

| # | Sección | Descripción | Severidad | Ticket |
|---|---------|-------------|-----------|--------|
| 1 | | | [ ] Crítico [ ] Alto [ ] Medio [ ] Bajo | |
| 2 | | | [ ] Crítico [ ] Alto [ ] Medio [ ] Bajo | |
| 3 | | | [ ] Crítico [ ] Alto [ ] Medio [ ] Bajo | |
| 4 | | | [ ] Crítico [ ] Alto [ ] Medio [ ] Bajo | |
| 5 | | | [ ] Crítico [ ] Alto [ ] Medio [ ] Bajo | |

---

## Notas Adicionales

```
_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________
```

---

## Firma de Aprobación

**QA:** _______________  **Fecha:** _______________

**Dev Lead:** _______________  **Fecha:** _______________
