# Pendientes de Vetify

Lista viva de lo que falta. Lo más importante va arriba. Cuando algo se cierre, se marca con `[x]`, se anota la fecha y el PR, y se mueve a "Cerrados".

Última actualización: 12/Nov/2026

## Prioridad 0: no negociable

- [ ] **Configuración inicial de una clínica: horarios, servicios y equipo.** Tiene que funcionar perfecto, de punta a punta.
  - **Por qué:** el 12/Nov le ofrecimos por correo al MVZ de Animal Medical Centre una llamada de 15 minutos "para dejarte todo configurado (horarios, servicios, tu equipo)". Si algo falla en vivo, perdemos al primer usuario que llegó a crear una cita.
  - **Horarios:** `src/components/settings/BusinessHoursSettings.tsx`. Guardar y editar los horarios, y verificar que se reflejen en los slots de `AppointmentForm` y en la reserva pública (`src/components/public/QuickBooking.tsx`).
  - **Servicios:** `src/components/settings/ServiceManagement.tsx` y `ServiceModal.tsx`. Crear, editar, desactivar y borrar servicios, con precios en la moneda del tenant, y verificar que aparezcan al agendar.
  - **Equipo:** `src/app/dashboard/staff/new`, `src/app/dashboard/staff/[id]` y `src/app/api/invitations/{send,validate,accept}`. Revisar que el correo de invitación llegue, que el invitado pueda aceptar (con o sin cuenta de Kinde), que quede ligado al tenant correcto con su rol y que respete los límites del plan.
  - **Hecho cuando:** existe un E2E de Playwright que cubre los tres flujos y pasa en CI, y el flujo completo se probó a mano en producción con un tenant de prueba antes de la llamada.
  - **Estado en prod (12/Nov):** Animal Medical Centre tiene 0 servicios, 0 horarios guardados y 0 sucursales; en la llamada todo se configura desde cero. En toda la vida de prod solo hay 2 invitaciones de equipo.
  - **Auditoría de código (12/Nov).** Los marcados con ✔ los verifiqué contra el código; el resto viene de la auditoría y está trazado, pero falta confirmarlo con tests.

    **Horarios (bloquean la llamada)**
    - [ ] ✔ **Zona horaria.** Los slots se generan en UTC (`src/lib/appointments/availability.ts`, `api/appointments/availability`, `api/public/availability`) y se mandan sin zona (`formatLocalDateTime`). El navegador los toma como hora de México, así que una cita de las 9:00 bloquea el slot de las 15:00 y se pueden empalmar citas. Además, "hoy" esconde los horarios de las siguientes ~6 horas. `TenantSettings.timezone` se crea como `'UTC'` (`src/lib/tenant.ts:182`).
    - [ ] **"Sin comida" no se guarda.** La UI manda `undefined`, Prisma lo ignora y al recargar vuelve la hora de comida. Hay que mandar `null`.
    - [ ] **Los tenants nuevos no tienen filas de horario** hasta que el dueño abre la pestaña Horarios. Mientras tanto, la agenda y la reserva pública muestran todos los días como "no laborable".
    - [ ] **La "Duración de cita" por defecto no hace nada** si no se da "Aplicar a todos los días".
    - [ ] **Seguridad (IDOR):** el PUT de horarios actualiza por `id` sin filtrar por `tenantId`.
    - [ ] Menores: comida sin hora de fin, cierres a la media hora, duración de 45 min, citas que se pasan del cierre, sin validación de rangos, el calendario ignora los horarios guardados.

    **Servicios**
    - [ ] **La reserva pública ignora el catálogo.** `QuickBooking.tsx` lee el JSON viejo `publicServices` y no la tabla `Service`.
    - [ ] **Las citas no usan servicios** (no hay `serviceId`). Es un hueco de producto: decírselo claro en la llamada o agregar el selector.
    - [ ] Chicos: el error de nombre duplicado no se muestra, vaciar precio o duración da error en inglés, "Eliminar" un servicio con ventas lo desactiva pero la UI lo desaparece, el precio ignora la moneda del tenant, el tope de 99,999 sigue en el código, y BOARDING y HOSPITALIZATION se muestran con la misma etiqueta.

    **Equipo**
    - [ ] ✔ **Reinvitar tras expirar falla siempre.** `TenantInvitation.staffId` es `@unique` y `generateStaffInvitation` revoca la invitación y luego crea otra con el mismo `staffId`. El toast muestra el error de Prisma en inglés.
    - [ ] **Aceptar con otro correo es un callejón sin salida.** Da 403 sin opción de cerrar sesión, y al ir a `/dashboard` el invitado termina creando su propia clínica. Para la llamada: abrir el link en incógnito.
    - [ ] **Un invitado que ya tiene clínica** recibe un 500 genérico.
    - [ ] Menores: no se aplica el límite de staff del plan, desactivar a alguien no le quita el acceso, no se puede cancelar una invitación, las invitaciones expiradas siguen como "pendientes" y los nombres de rol en el correo no coinciden con la app.
    - ✔ Héctor sí ve "Agregar Personal": su staff es "Administrador", activo y ligado.

    **Tests:** los de integración de servicios e invitaciones solo prueban `prismaMock` y no llaman las routes reales. Los E2E de settings buscan test IDs que no existen en el código.

## Prioridad 1

- [ ] **Correos que se pierden en Vercel.** Varios envíos salían sin `await` y Vercel congelaba la función antes de que terminaran. Se movieron a `after()` con el helper `src/lib/after-response.ts`. Ya está hecho en la rama `fix/after-background-emails` (worktree `vetify-worktrees/after-background-emails`), pero falta el commit, el PR a `development` y el release.
- [ ] **El formulario de citas se prellena con la hora actual.** `AppointmentForm.tsx` deja guardar sin elegir un horario y el server acepta fechas pasadas. Las dos citas reales que hay en prod quedaron en el pasado.
  - **Fix:** obligar a elegir un horario y, para fechas pasadas, mostrar una advertencia en vez de bloquear.
  - **Limpieza:** `validateAppointmentTime` (`src/lib/validations/appointments.ts`) es código muerto: hay que borrarlo o usarlo.
- [ ] **Regreso después del día 0.** Los tenants que activan (cliente + mascota + cita) no vuelven al día siguiente. Para cada alta nueva que active: contacto personal.

## Prioridad 2

- [ ] **Webhook de Resend** para llenar `EmailLog.deliveredAt`. Hoy no sabemos si los correos llegan ni si los abren.
- [ ] **Tenants con el trial vencido que siguen en `TRIALING`** (24 de 31 al 11/Nov). El acceso se calcula por fecha, así que no los deja pasar, pero las métricas salen sucias. Hacer el backfill o el cambio de status.
- [ ] **Stripe:** rotar las llaves.

## Limpieza

- [ ] Cerrar los issues #189 y #190 si ya los resolvió el PR #237.
- [ ] Quitar los worktrees de ramas ya mergeadas: `cleanup-qa-lows`, `csp-unify-meta-pixel`, `dashboard-first-run-ctas` y `landing-signup-cta`.

## Cerrados

_(vacío)_
