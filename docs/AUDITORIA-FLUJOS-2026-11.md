# Auditoría de flujos indispensables (12/Nov/2026)

Esta es una revisión del código de los 7 flujos de los que depende una clínica. Se leyó el código de la rama `fix/p0-clinic-setup` (PR #247) y se cruzó con datos de producción. No se corrió la app.

El flujo de configuración (horarios, servicios y equipo) se auditó antes y sus fixes ya van en el PR #247; aquí no se repite. Para el seguimiento de pendientes, ver `docs/PENDIENTES.md`.

**Marcas:**
- ✔ = verificado contra el código o contra la base de prod.
- 💳 = toca cobro o permisos: hay que decidirlo antes de arreglarlo.
- 🗄 = requiere un cambio de esquema.

## Hallazgo transversal: la red de pruebas no prueba lo que creemos

- ✔ **Los E2E con login nunca han corrido.** `tests/auth.setup.ts` hace POST a `/api/test-auth`, una ruta que no existe, y los specs se saltan si no está `TEST_AUTH_ENABLED`, que CI nunca define. Los E2E que pasaban eran solo los públicos.
- ✔ **Los specs del dashboard buscan `data-testid` que no existen en el código.** Por ejemplo, 26 de 41 en citas, unos 31 en clientes y mascotas, y unos 50 en suscripción. Además, muchas aserciones están detrás de `if (isVisible)`, así que pasan sin probar nada.
- ✔ **Muchos tests de integración son "teatro de mocks"**: no importan la ruta real y solo verifican lo que el mismo test le dio a `prismaMock`. Pasa en clientes, mascotas, citas, historia clínica, invitaciones, servicios y onboarding.
- ✔ **`pnpm typecheck` no revisa tipos**, porque el `tsconfig` trae `noCheck: true`. Hay unos 760 errores reales en el repo.
- ✔ **Desde el 26/Oct no corría ningún E2E**, porque `ubuntu-latest` pasó a 26.04 y Playwright no instala Chromium ahí. El aviso por issue tampoco tenía permiso para crearse. Ya está corregido en el PR #247.

## 1. Registro y onboarding

- ✔ **Los errores del alta se tragan.** `OnboardingForm.tsx:111` solo hace `console.error`. Ante un 500, un 403 o un 429, el botón deja de girar y no aparece nada. Es candidato directo al abandono en el registro.
- ✔ 🗄 **Algunas personas nunca pueden crear su clínica.** `Staff.email` es `@unique` para todas las clínicas. Si otra clínica ya dio de alta a una doctora como staff, al registrarse su alta falla con P2002, siempre y sin ningún mensaje.
- **Callejón sin salida con el mismo correo y un id nuevo de Kinde.** Pasa si la persona se vuelve a registrar o entra con otra red social. `findOrCreateUser` lanza error y el usuario termina en `/sign-in` en bucle.
- **Las referencias nunca se atribuyen.** La cookie `vetify_ref` se escribe pero nadie la lee, y `OnboardingForm` no manda `referralCode`.
- **El copy dice "30 días gratis" aunque haya una promoción** con otra duración.
- **No hay slugs reservados.** Se aceptan `precios`, `admin`, `api` e `invite`, y esa clínica se queda sin página pública.
- **El slug puede cambiar a uno viejo.** Las consultas de disponibilidad no tienen debounce y pueden llegar fuera de orden.
- Menores: `/sign-up` está en inglés y sin modo oscuro; un nombre de puros espacios genera el slug `-`; cualquier error en `onboarding/page.tsx` redirige a `/sign-in`.
- **Por verificar:**
  - Que el origen permitido por CSRF (`NEXT_PUBLIC_APP_URL`) no bloquee los previews.
  - Que las URLs de Kinde usen `www`.
  - Si algún método de login de Kinde devuelve usuarios sin email.

## 2. Clientes y mascotas

- ✔ **El formulario combinado dice "¡Cliente creado exitosamente!" aunque la mascota falle.** Pasa en `NewCustomerForm.tsx:151-165`, y hay un test que asegura ese comportamiento. Es lo que más se parece a lo que le pasó a "ejemplo" (1 cliente con correo y 0 mascotas).
- ✔ **Las unidades de peso no coinciden.** El form ofrece `g` y `lb`, y el server solo acepta `kg` y `lbs`, así que la mascota falla.
- **`AddPetForm` vuelve a crear el cliente en cada reintento.** Con email choca con "Ya existe un cliente"; sin email lo duplica. La lista de clientes existentes no se recarga.
- **Los errores de Zod le llegan al usuario como JSON en inglés** en `/api/pets` y `/api/customers`.
- **El selector de dueño solo muestra 10 clientes.** Además, `?customerId=` no preselecciona al cliente.
- **Los límites de mascotas están mal:**
  - El plan ilimitado (`-1`) bloquea todas las altas.
  - Los trials quedan topados en 50 en vez de 300.
  - "Mejorar Plan" lleva a un 404.
- **La búsqueda solo filtra la página cargada.** Distingue acentos y no normaliza teléfonos.
- **La ubicación del cliente se descarta**, porque falta `locationId` en el esquema.
- Menores:
  - Las mascotas de clientes archivados siguen apareciendo.
  - El DELETE de mascota es duro y en cascada.
  - `step=0.1` en el peso no deja capturar 0.05 kg.

## 3. Citas

- ✔ **La reserva pública no le llega a nadie.** La solicitud se guarda como `AppointmentRequest` PENDING y la notificación al staff está comentada. No hay bandeja para verlas ni forma de convertirlas en cita. En prod aún no hay ninguna solicitud, y las 31 clínicas tienen la reserva pública activa.
- **El calendario, la lista de hoy y las estadísticas ven como máximo 10 citas**, porque la paginación trae 10 por defecto.
- ✔ **Los correos de cita muestran la hora en UTC**: una cita de las 10:00 sale como 16:00. Pasa con `toLocaleTimeString` y `formatDateLong` sin `timeZone`, y también en la tarjeta de "Próximas citas", que además incluye las canceladas.
- ✔ **Los recordatorios de cita casi nunca se mandan.** El cron corre a las 07:00 UTC y solo busca citas entre 24 y 25 horas adelante, o sea, citas entre la 1:00 y las 2:00 de México. En prod nunca se ha mandado uno, con 31 citas registradas.
- **La reserva pública expone datos y no tiene límite de peticiones.** Devuelve mascotas y clientes de cualquiera con un teléfono o nombre parecido, y el middleware excluye `/api/public/`. `customer-lookup` con el dígito "1" regresa datos de clientes.
- **Arrastrar una cita en el calendario siempre se revierte**, porque revisa `appointment.canEdit` en vez de `extendedProps`.
- **La validación de choques usa la duración equivocada**, y no valida nada si la cita no tiene staff asignado.
- **Cualquier cambio de estado es válido.** Se puede cancelar dos veces y mandar dos correos, o cancelar una cita ya completada.
- **Editar desde el modal obliga a reprogramar** (no pasa `appointmentId`) y resetea la ubicación.
- **Las vistas de semana y día esconden las citas después de las 18:00.**
- Menores: errores en inglés en la ruta pública; el botón "Actualizar Cita" aparece al crear; los webhooks v1 se disparan sin esperar.

## 4. Historia clínica

- ✔ **Los recordatorios de vacunas y tratamientos nunca se crean.** Se guarda el `TreatmentSchedule`, pero nunca el `Reminder`. En prod hay 2 programaciones, una a futuro, y 0 recordatorios. Si existieran, el correo diría "Faltan 0 días", con la fecha una semana antes y el tipo en inglés.
- **`/dashboard/medical-history/new` no funciona de punta a punta.**
  - La búsqueda de mascota lee `data.pets`, pero la API regresa `{data}`.
  - Guarda `staffId = user.id` (el id de Kinde), lo que viola la llave foránea.
  - Las recetas mandan `productId: ''`, que también viola la llave foránea.
- **El detalle de una historia siempre dice "no encontrada"**: el server component hace fetch a su propia API sin cookies.
- **La vacuna no se guarda si "Etapa" queda vacía**, y no muestra ningún error.
- **Datos que se pierden:** "Próxima cita" se descarta, la fecha de visita siempre es "ahora" y la historia no se liga a la cita.
- 💳 **Aislamiento entre clínicas:**
  - treatments, vaccinations y vitals no validan que `petId` sea de la clínica.
  - `veterinarian_id` tampoco se valida.
  - Las rutas clínicas no aplican permisos por rol: una recepcionista puede escribir en la historia clínica.
- **La línea de tiempo se muestra en UTC.** Además, "Atendido por" nunca aparece, porque falta el `include` de staff.
- **Los chips de medicamento no llenan el campo del formulario**, y dosis y frecuencia se guardan dentro de `notes`.
- **Los signos vitales se guardan como una consulta falsa** con diagnóstico "N/A", y no actualizan el peso de la mascota.
- No hay forma de editar ni borrar registros clínicos, y faltan clases de modo oscuro en varios componentes.

## 5. Trial y suscripción

- ✔ 💳 **El plan anual se cobra como mensual.** `/precios` manda `'annual'` y `getStripePriceIdForPlan` solo reconoce `'yearly'`.
- ✔ 💳 **Cambiar de plan cancela la suscripción antes de pagar la nueva.** `stripe.ts:428-442` lo hace al crear la sesión. Si el cliente abandona el Checkout, se queda sin plan. Cualquier staff puede dispararlo.
- 💳 **Los eventos de una suscripción vieja pisan la actual**, porque no se compara contra `stripeSubscriptionId`. Una suscripción en trial duplicada sobrevive y puede cobrar doble.
- 💳 **"Suscribirse Ahora" siempre cobra Profesional** ($1,199); nunca ofrece Básico.
- 💳 **Meses gratis de más:**
  - Una promoción de trial se aplica dos veces.
  - Quien cancela y vuelve a suscribirse recibe otros 30 días.
  - Hoy no hay promociones activas.
- 💳 **El primer cobro fallido bloquea la clínica**: PAST_DUE pierde el acceso de inmediato, sin periodo de gracia.
- 💳 **El acceso solo se valida en algunas rutas.** La de mascotas sí lo valida; citas, clientes, historia, ventas y staff no. Las API keys siguen funcionando después de vencer, y el límite de staff nunca se aplica.
- UX:
  - El regreso del Checkout no muestra confirmación.
  - `/precios` ignora `?error=`.
  - "Actualizar Pago" lleva a la pestaña equivocada.
  - Los errores de Stripe se muestran en inglés.
- **Por verificar en Stripe y Vercel:**
  - `NEXT_PUBLIC_BASE_URL` en prod.
  - Los precios en CLP/COP/USD.
  - Que el webhook esté suscrito a los 5 eventos que usamos.
  - Si hay filas `StripeWebhookEvent` FAILED.

## 6. Correos y crons

- ✔ **Las alertas de inventario bajo nunca se mandan.** Consultan `staff.role.permissions` y `staff.user`, que no existen en el esquema. El error se atrapa y el job reporta 0 alertas.
- ✔ **Los recordatorios de cita no salen** (ver la sección de Citas).
- **El cron esconde sus fallas**: los procesadores regresan `success: false` y el job responde 200 sin avisar a Sentry.
- **El correo de "trial vencido" llega unos 6 días tarde**, porque comparte `lastTrialCheck` con el de "por vencer".
- **El webhook de Resend existe, pero verifica mal la firma**: rechazaría cada evento con 401. Hay que usar la librería `svix`.
- Menores:
  - Los correos de referidos ignoran `response.error` y les faltan acentos.
  - El reply-to de los correos a clientes es el de Vetify, no el de la clínica.
  - Hay correos de clientes en los logs.
  - Las URLs base caen a `localhost` o a la apex.
- **Por verificar:**
  - Las variables `RESEND_*`, `NEXT_PUBLIC_BASE_URL` y `CRON_SECRET` en Vercel.
  - Que el dominio esté verificado en Resend.
  - El historial del cron `daily-tasks` en Vercel.

## 7. Producción hoy (12/Nov)

- No hay correos fallidos en 60 días.
- El audit log registra todas las semanas, pero no tiene ni un evento fallido en 60 días. Es sospechoso: puede que solo guarde los éxitos.
- No hay solicitudes de reserva pública ni promociones activas.
- No hay cobros, así que los bugs de pago aún no le han costado dinero a nadie.
- Sentry está pendiente: no hubo acceso desde aquí.
