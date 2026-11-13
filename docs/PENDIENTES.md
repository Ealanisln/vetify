# Pendientes de Vetify

Lista viva de lo que falta. Lo más importante va arriba. Cuando algo se cierre, se marca con `[x]`, se anota la fecha y el PR, y se mueve a "Cerrados".

Última actualización: 13/Nov/2026 (v1.13.0 en prod desde el 12/Nov; tanda 4: #259 a #261 mergeados a `development`, #262 abierto)

## Prioridad 0: no negociable

- [ ] **Configuración inicial de una clínica: horarios, servicios y equipo.** Tiene que funcionar perfecto, de punta a punta.
  - **Por qué:** el 12/Nov le ofrecimos por correo al MVZ de Animal Medical Centre una llamada de 15 minutos "para dejarte todo configurado (horarios, servicios, tu equipo)". Si algo falla en vivo, perdemos al primer usuario que llegó a crear una cita.
  - **Horarios:** `src/components/settings/BusinessHoursSettings.tsx`. Guardar y editar los horarios, y verificar que se reflejen en los slots de `AppointmentForm` y en la reserva pública (`src/components/public/QuickBooking.tsx`).
  - **Servicios:** `src/components/settings/ServiceManagement.tsx` y `ServiceModal.tsx`. Crear, editar, desactivar y borrar servicios, con precios en la moneda del tenant, y verificar que aparezcan al agendar.
  - **Equipo:** `src/app/dashboard/staff/new`, `src/app/dashboard/staff/[id]` y `src/app/api/invitations/{send,validate,accept}`. Revisar que el correo de invitación llegue, que el invitado pueda aceptar (con o sin cuenta de Kinde), que quede ligado al tenant correcto con su rol y que respete los límites del plan.
  - **Hecho cuando:** existe un E2E de Playwright que cubre los tres flujos y pasa en CI, y el flujo completo se probó a mano en producción con un tenant de prueba antes de la llamada.
  - **Avance (12/Nov):** el E2E existe y pasa en CI (`tests/e2e/clinic-setup/clinic-setup.spec.ts`, PR #255). #255 ya está en prod (v1.13.0). Falta la prueba manual en prod con un tenant de prueba.
  - **Estado en prod (12/Nov):** Animal Medical Centre tiene 0 servicios, 0 horarios guardados y 0 sucursales; en la llamada todo se configura desde cero. En toda la vida de prod solo hay 2 invitaciones de equipo.
  - **Auditoría de código (12/Nov).** Los marcados con ✔ los verifiqué contra el código; el resto viene de la auditoría y está trazado, pero falta confirmarlo con tests.

    **Horarios (bloquean la llamada)**
    - [x] ✔ **Zona horaria.** Los slots se generan en UTC (`src/lib/appointments/availability.ts`, `api/appointments/availability`, `api/public/availability`) y se mandan sin zona (`formatLocalDateTime`). El navegador los toma como hora de México, así que una cita de las 9:00 bloquea el slot de las 15:00 y se pueden empalmar citas. Además, "hoy" esconde los horarios de las siguientes ~6 horas. `TenantSettings.timezone` se crea como `'UTC'` (`src/lib/tenant.ts:182`). _Resuelto en el PR de P0 (12/Nov)._
    - [x] **"Sin comida" no se guarda.** La UI manda `undefined`, Prisma lo ignora y al recargar vuelve la hora de comida. Hay que mandar `null`. _Resuelto en el PR de P0 (12/Nov)._
    - [x] **Los tenants nuevos no tienen filas de horario** hasta que el dueño abre la pestaña Horarios. Mientras tanto, la agenda y la reserva pública muestran todos los días como "no laborable". _Resuelto en el PR de P0 (12/Nov)._
    - [x] **La "Duración de cita" por defecto no hace nada** si no se da "Aplicar a todos los días". _Resuelto en el PR de P0 (12/Nov)._
    - [x] **Seguridad (IDOR):** el PUT de horarios actualiza por `id` sin filtrar por `tenantId`. _Resuelto en el PR de P0 (12/Nov)._
    - [x] Menores: comida sin hora de fin, cierres a la media hora, duración de 45 min, citas que se pasan del cierre, sin validación de rangos, el calendario ignora los horarios guardados. _Validación de rangos, comida sin fin y cierres a la media hora en #247; el calendario lee los horarios guardados desde #248._

    **Servicios**
    - [x] **La reserva pública ignora el catálogo.** `QuickBooking.tsx` lee el JSON viejo `publicServices` y no la tabla `Service`. _Resuelto en el PR de P0 (12/Nov)._
    - [ ] **Las citas no usan servicios** (no hay `serviceId`). Es un hueco de producto: decírselo claro en la llamada o agregar el selector.
    - [x] Chicos: el error de nombre duplicado no se muestra, vaciar precio o duración da error en inglés, "Eliminar" un servicio con ventas lo desactiva pero la UI lo desaparece, el precio ignora la moneda del tenant, el tope de 99,999 sigue en el código, y BOARDING y HOSPITALIZATION se muestran con la misma etiqueta. _Resuelto en el PR de P0 (12/Nov)._

    **Equipo**
    - [x] ✔ **Reinvitar tras expirar falla siempre.** `TenantInvitation.staffId` es `@unique` y `generateStaffInvitation` revoca la invitación y luego crea otra con el mismo `staffId`. El toast muestra el error de Prisma en inglés. _Resuelto en el PR de P0 (12/Nov)._
    - [x] **Aceptar con otro correo es un callejón sin salida.** Da 403 sin opción de cerrar sesión, y al ir a `/dashboard` el invitado termina creando su propia clínica. Para la llamada: abrir el link en incógnito. _Resuelto en el PR de P0 (12/Nov)._
    - [x] **Un invitado que ya tiene clínica** recibe un 500 genérico. _Resuelto en el PR de P0 (12/Nov)._
    - [ ] Menores: no se aplica el límite de staff del plan, desactivar a alguien no le quita el acceso, no se puede cancelar una invitación, las invitaciones expiradas siguen como "pendientes" y los nombres de rol en el correo no coinciden con la app. _En el PR de P0: las invitaciones expiradas ya se marcan como expiradas y los roles del correo coinciden con la app. El resto queda en "Decisiones pendientes"._
    - ✔ Héctor sí ve "Agregar Personal": su staff es "Administrador", activo y ligado.

    **Tests:** ~~los de integración de servicios e invitaciones solo prueban `prismaMock`~~ ahora llaman las rutas reales (#252). ~~Los E2E de settings buscan test IDs que no existen~~ ya están alineados (#255).

## Prioridad 0-B: auditoría de flujos indispensables (12/Nov)

El detalle completo está en `docs/AUDITORIA-FLUJOS-2026-11.md`. Aquí solo va lo que más le duele a una clínica real.

**Se puede arreglar ya:** ✅ resuelto en el PR de la tanda 2 (`fix/p0b-indispensable-flows`, 12/Nov). Incluye:
- Onboarding: el error ahora se muestra, hay slugs reservados, el slug ya no cambia por respuestas viejas, el trial muestra los días reales y los slugs ya no quedan con guiones en las orillas.
- Plan anual: `annual` ahora se mapea a `yearly`.
- Clientes y mascotas: falso éxito, unidades de peso, cliente duplicado al reintentar, selector de dueño, errores en español, límites de mascotas, ubicación del cliente y búsqueda sin acentos.
- Calendario: carga todas las citas, arrastrar funciona, editar sin reprogramar, horario real de la clínica y la tarjeta de "Próximas citas".
- Correos y crons: recordatorios de cita, horas en la zona de la clínica, alertas de inventario, el cron reporta sus fallas, "trial vencido" a tiempo y firma de Resend.
- Historia clínica: recordatorios de vacunas, el formulario de historia nueva, el detalle, "Etapa" vacía, chips, línea de tiempo y signos vitales.
- Reserva pública: sin exposición de datos, búsqueda segura, sin cambios a clientes existentes y límite de peticiones.

**Tanda 3 (no requería decisión):** mergeada el 12/Nov y en prod con v1.13.0.
- [x] Citas: transiciones de estado inválidas y cancelación doble. _PR #251._
- [x] Citas: choques con la duración real; sin staff, choca con cualquier cita que se empalme en la clínica. _PR #251._
- [x] Calendario en la zona de la clínica (`@fullcalendar/luxon3`). _PR #254._
- [x] `updateCustomer` parcial y `locationId`. _PR #249._
- [x] `validatePlanAction` con `-1` (ilimitado). También arregla que el trial dejaba WhatsApp en `-1` crudo y no se podía mandar. _PR #249._
- [x] `/api/v1/pets` acepta `lb` como alias y guarda `lbs`. _PR #249._
- [x] Mascotas de clientes archivados fuera de las listas. _PR #249._
- [x] Fechas con zona en correos de trial, cobro y retención. _PR #253._
- [x] URL base única (`src/lib/app-url.ts`, cae a `www`) y reply-to de la clínica en correos a clientes. _PR #253._
- [x] Historia clínica: próxima aplicación, "Agendar seguimiento", fecha opcional y selector de inventario. _PR #250._
- [x] Consulta muerta de `CONFIRMED` en `api/public/availability`. _PR #251._

**Tanda 4 (no requería decisión):** 13/Nov, en `development` salvo #262.
- [x] La lista de "hoy" y las estadísticas de citas en la zona de la clínica. La pantalla de inicio del dashboard no calcula cortes por día, así que no aplica. _PR #261._
- [x] La búsqueda pública de clientes ya no encuentra clientes archivados. _PR #259._
- [x] `robots.ts` acepta la apex y `www`. _PR #259._
- [ ] E2E: fixture de veterinario sin rol de admin (los 8 tests de acceso por rol ya corren) y clínica con plan CORPORATIVO (`api-keys.spec.ts` sin `if (isVisible)`). _PR #262, abierto: falta que pase el CI y mergearlo._
- [x] Los tests de Stripe usan una llave falsa si no hay una configurada; el pre-commit ya no falla en worktrees. _PR #260._

**Tanda 5 (no requiere decisión, arrancar con agentes en paralelo cuando #262 esté mergeado):**
- [ ] **La UI de webhooks no está montada.** `WebhookConfig` no se exporta ni se usa en ninguna página, así que el plan CORPORATIVO no puede configurar webhooks. Montarla en settings y quitar los `test.fixme` de `tests/e2e/settings/webhooks.spec.ts` (salió de #262).
- [ ] **No se puede elegir sucursal al crear una API key.** `ApiKeyManagement` guarda toda la respuesta de `/api/locations` en lugar de `data.data`, y el selector nunca aparece. Quitar el `test.fixme` correspondiente en `api-keys.spec.ts` (salió de #262).
- [ ] **La reserva pública liga clientes archivados.** `POST /api/public/appointments` todavía identifica por teléfono a clientes archivados al crear la reserva; #259 solo arregló la búsqueda (salió de #259).
- [ ] Los worktrees nuevos necesitan `pnpm prisma generate`, o 3 suites de unit fallan por falta de `.prisma/client`. Evaluar un `postinstall` o documentarlo.

**Requiere decisión (💳 cobro/permisos, 🗄 esquema):**
- [ ] 💳 Cambiar de plan cancela la suscripción antes de cobrar la nueva.
- [ ] 💳 Los eventos de una suscripción vieja pisan a la actual.
- [ ] 💳 "Suscribirse Ahora" siempre cobra Profesional.
- [ ] 💳 No hay periodo de gracia para PAST_DUE.
- [ ] 💳 Promociones aplicadas dos veces, y 30 días extra al volver a suscribirse.
- [ ] 💳 El acceso solo se valida en algunas rutas, las API keys siguen después de vencer y no hay permisos por rol en las rutas clínicas.
- [ ] 🗄 `Staff.email` es único entre clínicas, y eso impide el alta de algunas personas.
- [ ] **Reserva pública: hoy nadie en la clínica se entera de las solicitudes.** La propuesta es mandarle un correo al dueño y a los admins con el resumen y un link al dashboard, más un contador de pendientes en el dashboard. Los contactos que da quien reserva ya se guardan en `reviewNotes`.
- [ ] **6 clínicas tienen el slug terminado en guion** (por ejemplo `kvet-`), por un nombre con espacio al final. Ya no pasa en altas nuevas. Corregirlas rompería los links que ya hayan compartido: decidir si se avisa y se cambia.
- [ ] El correo de "trial vencido" llega 6 días tarde (una columna nueva o leer el EmailLog).

**La red de pruebas:**
- [x] Sesión de prueba para E2E. En lugar de `/api/test-auth`, el job de E2E apunta `KINDE_ISSUER_URL` a un issuer falso en `127.0.0.1` que firma los tokens; el código de auth de la app no cambia. Guardas: `TEST_AUTH_ENABLED`, sin `VERCEL`/`VERCEL_ENV` y un secreto aleatorio por corrida. _PR #255._
- [x] `data-testid` alineados en los specs de settings y sin los `if (isVisible)`. _PR #255._
- [x] Tests de integración de servicios, invitaciones y horarios contra las rutas reales. Encontró y arregló que `POST`/`PUT /api/services` aceptaban un `locationId` de otra clínica. _PR #252._

**Decisiones que salieron de la tanda 3:**
- [ ] Dos citas sin veterinario asignado ya no se pueden empalmar (#251). Bien para clínicas de un vet; una clínica con varios tendría que asignar uno para agendar a la misma hora.
- [ ] El API v1 responde 409 al borrar una cita ya cancelada, en vez de 204 (#251). Se dejó así para no cambiar el contrato.
- [ ] El API v1 ahora responde `lbs` donde antes respondía `lb` (#249). ¿Hacer un backfill de `lb` a `lbs` en los datos? Requiere migración.
- [ ] Reply-to de correos a clientes: primero `publicEmail` y luego el administrador más antiguo (#253).
- [ ] Las alertas de cobro (le llegan a Vetify) van en hora de CDMX (#253).
- [ ] Al guardar una historia clínica ahora se abre su detalle en lugar de la lista (#250).
- [ ] Las rutas de servicios solo piden sesión: cualquier rol puede editar el catálogo (queda como `it.todo` en #252).

## Prioridad 1

- [x] **Correos que se pierden en Vercel.** Varios envíos salían sin `await` y Vercel congelaba la función antes de que terminaran. Se movieron a `after()` con el helper `src/lib/after-response.ts`. Ya está hecho en la rama `fix/after-background-emails` (worktree `vetify-worktrees/after-background-emails`), pero falta el commit, el PR a `development` y el release. _Resuelto en el PR de P0 (12/Nov)._
- [x] **El formulario de citas se prellena con la hora actual.** `AppointmentForm.tsx` deja guardar sin elegir un horario y el server acepta fechas pasadas. Las dos citas reales que hay en prod quedaron en el pasado. _Resuelto en el PR de P0 (12/Nov)._
  - **Fix:** obligar a elegir un horario y, para fechas pasadas, mostrar una advertencia en vez de bloquear.
  - **Limpieza:** `validateAppointmentTime` (`src/lib/validations/appointments.ts`) es código muerto: hay que borrarlo o usarlo.
- [ ] **Regreso después del día 0.** Los tenants que activan (cliente + mascota + cita) no vuelven al día siguiente. Para cada alta nueva que active: contacto personal.

## Decisiones pendientes (salieron del PR de P0)

- [ ] **Kinde:** permitir `https://www.vetify.pro/invite` como URL de regreso al cerrar sesión, antes de la llamada. Si no, el botón para cambiar de cuenta en la invitación falla.
- [ ] **Clínicas sin horario guardado:** unas 30 van a ofrecer citas de Lun a Sáb, de 8:00 a 18:00, por el horario por defecto. Avisarles o revisar que sea lo que queremos.
- [ ] **Zona horaria:** guardar en `TenantSettings.timezone` la zona correcta de las clínicas que ya existen. Hoy el código ignora el valor `'UTC'`, así que funciona, pero lo correcto es guardarla.
- [ ] **Citas recorridas 6 horas:** revisar a mano las que ya se guardaron con el bug.
- [ ] **Horarios duplicados:** un índice único parcial en `BusinessHours (tenantId, dayOfWeek) WHERE locationId IS NULL`. Es una migración y primero hay que limpiar los duplicados que ya existan.
- [ ] **Equipo:**
  - Aplicar el límite de staff del plan.
  - Quitar el acceso al desactivar a alguien.
  - Una ruta y una pantalla para cancelar invitaciones.
  - Revisar `isTenantOwner`, que hoy toma al `User` más antiguo como dueño.
  - Revisar el `canWrite` de la página de staff, que no tiene el fallback para el dueño.
  - `Staff.email` es único entre clínicas, así que una persona no puede ser staff en dos.
- [ ] **Servicios:**
  - Agregar `serviceId` a `Appointment` y un selector en el formulario de citas.
  - Permisos por rol en las rutas de servicios.
  - Servicios de ejemplo al dar de alta una clínica.
- [ ] **Tipos:** el `tsconfig` trae `noCheck: true`, así que `pnpm typecheck` no revisa nada. Hay unos 760 errores reales en el repo; quitar `noCheck` y bajarlos poco a poco.

## Prioridad 2

- [ ] **Webhook de Resend** para llenar `EmailLog.deliveredAt`. Hoy no sabemos si los correos llegan ni si los abren.
- [ ] **Tenants con el trial vencido que siguen en `TRIALING`** (24 de 31 al 11/Nov). El acceso se calcula por fecha, así que no los deja pasar, pero las métricas salen sucias. Hacer el backfill o el cambio de status.
- [ ] **Stripe:** rotar las llaves.

## Limpieza

_(nada por ahora)_

## Cerrados

- [x] Cerrar los issues #189 y #190. #189 lo resolvió #237; #190 verificado en prod: `/api/version` y `/api/health` responden 200. _12/Nov._
- [x] Quitar los worktrees de ramas ya mergeadas (16, incluidos los de #247 y #248). _12/Nov._
