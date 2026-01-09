# E2E Dashboard Tests

Este directorio contiene los tests E2E para los flujos críticos del dashboard de Vetify.

## Archivos de Test

| Archivo | Descripción | Flujos Cubiertos |
|---------|-------------|------------------|
| `pets.spec.ts` | Tests de gestión de mascotas | Lista, agregar, editar, eliminar, límite por plan, filtro por ubicación |
| `appointments.spec.ts` | Tests de citas/calendario | Calendario, crear cita, editar, cancelar, vistas día/semana/mes |
| `customers.spec.ts` | Tests de clientes | Lista, buscar, agregar, editar, relación con mascotas |
| `inventory.spec.ts` | Tests de inventario | Lista, stock, alertas, transferencias (Pro) |
| `settings.spec.ts` | Tests de configuración | Tabs, horarios, servicios, staff, notificaciones |
| `sales.spec.ts` | Tests de punto de venta | Abrir caja, crear venta, pagos, cerrar turno |

## Requisitos

### Autenticación
Los tests requieren una sesión autenticada. Para ejecutarlos, configura la variable de entorno:

```bash
TEST_AUTH_ENABLED=true pnpm test:e2e
```

### Data-TestID Requeridos

Para que los tests funcionen correctamente, los componentes deben tener los siguientes `data-testid`:

#### Mascotas (pets) - ✅ Parcialmente implementado
- [x] `add-pet-button` - Botón para agregar mascota
- [x] `pets-search-input` - Input de búsqueda
- [x] `clear-search` - Botón para limpiar búsqueda
- [x] `pet-card` - Tarjeta de mascota en la lista
- [x] `pet-name` - Nombre de la mascota
- [x] `pet-species` - Especie de la mascota
- [x] `pets-limit-indicator` - Indicador de límite de mascotas
- [x] `empty-pets-state` - Estado vacío
- [ ] `pet-header` - Header en página de detalle
- [ ] `pet-info-card` - Tarjeta de información
- [ ] `medical-history-card` - Tarjeta de historial médico
- [ ] `edit-pet-button` - Botón para editar
- [ ] `delete-pet-button` - Botón para eliminar
- [ ] `confirm-delete-dialog` - Diálogo de confirmación
- [ ] `pet-name-input` - Input de nombre en formulario
- [ ] `pet-species-select` - Select de especie
- [ ] `pet-owner-select` - Select de dueño
- [ ] `submit-pet-button` - Botón de submit

#### Citas (appointments) - ⏳ Pendiente
- [ ] `appointments-calendar` - Componente de calendario
- [ ] `new-appointment-button` - Botón nueva cita
- [ ] `view-day`, `view-week`, `view-month` - Botones de vista
- [ ] `calendar-prev`, `calendar-next`, `calendar-today` - Navegación
- [ ] `calendar-current-date` - Fecha actual
- [ ] `today-appointments` - Sección de citas de hoy
- [ ] `appointment-modal` - Modal de cita
- [ ] `appointment-pet-select` - Select de mascota
- [ ] `appointment-date-input` - Input de fecha
- [ ] `appointment-time-input` - Input de hora
- [ ] `appointment-service-select` - Select de servicio
- [ ] `submit-appointment-button` - Botón de submit

#### Clientes (customers) - ⏳ Pendiente
- [ ] `add-customer-button` - Botón agregar cliente
- [ ] `customers-search-input` - Input de búsqueda
- [ ] `customer-row` - Fila de cliente en tabla
- [ ] `customer-name` - Nombre del cliente
- [ ] `customer-email` - Email del cliente
- [ ] `customer-phone` - Teléfono del cliente
- [ ] `customer-stats` - Estadísticas de clientes
- [ ] `customer-name-input` - Input de nombre
- [ ] `customer-email-input` - Input de email
- [ ] `customer-phone-input` - Input de teléfono
- [ ] `submit-customer-button` - Botón de submit

#### Inventario (inventory) - ⏳ Pendiente
- [ ] `add-product-button` - Botón agregar producto
- [ ] `inventory-search-input` - Input de búsqueda
- [ ] `product-row` - Fila de producto
- [ ] `product-name` - Nombre del producto
- [ ] `product-stock` - Stock del producto
- [ ] `product-price` - Precio del producto
- [ ] `inventory-stats` - Estadísticas
- [ ] `low-stock-alerts` - Alertas de stock bajo
- [ ] `add-product-modal` - Modal de agregar
- [ ] `edit-product-modal` - Modal de editar
- [ ] `transfers-tab` - Tab de transferencias

#### Configuración (settings) - ⏳ Pendiente
- [ ] `settings-tabs` - Contenedor de tabs
- [ ] `public-page-settings` - Settings de página pública
- [ ] `business-hours-settings` - Settings de horarios
- [ ] `services-settings` - Settings de servicios
- [ ] `subscription-settings` - Settings de suscripción
- [ ] `notification-settings` - Settings de notificaciones
- [ ] `staff-settings` - Settings de personal
- [ ] `day-toggle-*` - Toggles de días (monday, tuesday, etc.)
- [ ] `open-time-*`, `close-time-*` - Inputs de horario
- [ ] `add-service-button` - Botón agregar servicio
- [ ] `service-modal` - Modal de servicio
- [ ] `service-row` - Fila de servicio

#### Ventas (sales) - ⏳ Pendiente
- [ ] `register-status` - Estado de la caja
- [ ] `open-register-button` - Botón abrir caja
- [ ] `close-register-button` - Botón cerrar caja
- [ ] `customer-search-input` - Búsqueda de cliente
- [ ] `product-search-input` - Búsqueda de producto
- [ ] `sales-cart` - Carrito de venta
- [ ] `cart-item` - Item del carrito
- [ ] `cart-total` - Total del carrito
- [ ] `checkout-button` - Botón de checkout
- [ ] `payment-modal` - Modal de pago
- [ ] `payment-method-cash` - Método efectivo
- [ ] `payment-method-card` - Método tarjeta
- [ ] `complete-sale-button` - Botón completar venta

## Ejecución de Tests

```bash
# Ejecutar todos los tests E2E del dashboard
TEST_AUTH_ENABLED=true pnpm test:e2e tests/e2e/dashboard

# Ejecutar un archivo específico
TEST_AUTH_ENABLED=true pnpm test:e2e tests/e2e/dashboard/pets.spec.ts

# Ejecutar con UI para debugging
TEST_AUTH_ENABLED=true pnpm test:e2e:ui tests/e2e/dashboard
```

## Notas

- Los tests están diseñados para ser resilientes y skipear condicionalmente cuando los elementos no existen
- Muchos tests verifican primero si el elemento existe antes de interactuar con él
- Los tests de features Pro verifican el feature gate y manejan ambos casos (con/sin acceso)

## Relacionado

- Issue: VETIF-187
- Parent: VETIF-186 (Plan de Mejoras QA)
- Referencia: `tests/e2e/qr-code-generator.spec.ts`
