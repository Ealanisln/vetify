# Programa de Referidos - Manual de Operacion

## Como funciona

El programa de referidos permite que personas externas (partners) recomienden Vetify a clinicas veterinarias. Cuando una clinica referida se suscribe y hace su primer pago, el partner gana una comision.

---

## Paso a paso

### 1. Registrar un Partner

1. Ir a **Admin > Referidos** en el panel de administracion
2. Click en **"Nuevo Partner"**
3. Llenar los datos:
   - **Nombre**: Nombre completo del partner
   - **Email**: Email donde recibira notificaciones de sus referidos
   - **Telefono**: Opcional
   - **Empresa**: Opcional (si representa una empresa)
   - **Comision (%)**: Porcentaje que gana por cada venta (ej: 20%)
   - **Notas**: Informacion interna (ciudades que cubre, acuerdos especiales, etc.)
4. Click en **"Crear Partner"**

### 2. Crear codigos de referido

1. Despues de crear el partner, click en **"Editar"** en la lista
2. En la seccion **"Codigos de Referido"**, escribir un codigo facil de recordar
   - Ejemplos: `DRCARLOS`, `VETMX2026`, `MONTERREY`
   - Solo letras, numeros, guiones y guiones bajos
   - Se convierte automaticamente a mayusculas
3. Click en **"Agregar"**
4. Se pueden crear multiples codigos por partner (uno por ciudad, por campana, etc.)

### 3. Compartir el link

El partner comparte este link con las clinicas:

```
https://vetify.pro/api/ref/DRCARLOS
```

(Reemplazar `DRCARLOS` con el codigo real)

Cuando alguien hace click:
- Se redirige automaticamente a la pagina de precios
- Se guarda una cookie en el navegador por 30 dias
- Se cuenta el click para estadisticas

### 4. Que pasa cuando una clinica se registra

1. La clinica se registra en Vetify (con o sin el codigo visible)
2. Si uso el link de referido, se guarda la atribucion automaticamente
3. En el panel de admin aparece como **"Registro"** (aun no ha pagado)
4. Cuando la clinica hace su primer pago, cambia a **"Convertido"**
5. Se calcula la comision automaticamente
6. Se envia email al admin y al partner

### 5. Gestionar pagos de comisiones

En **Admin > Referidos > Conversiones**:

1. Filtrar por **"Pago: Pendiente"** para ver comisiones por pagar
2. Revisar cada conversion y click en **"Aprobar"**
3. Realizar el pago al partner (transferencia bancaria, etc.)
4. Click en **"Marcar Pagado"** y agregar nota con referencia del pago

**Estados de pago:**
- **Pendiente**: Comision calculada, no revisada aun
- **Aprobado**: Revisada y aprobada para pago
- **Pagado**: Ya se transfirio el dinero al partner
- **Anulado**: Cancelada (por devolucion, fraude, etc.)

---

## Ejemplo con numeros

**Escenario:**
- Partner: Carlos Martinez, comision 20%
- Codigo: DRCARLOS
- Clinica referida: "Veterinaria San Angel"
- Plan contratado: Profesional ($1,199 MXN/mes)

**Resultado:**
- Comision por referido: $1,199 x 20% = **$239.80 MXN**
- Carlos recibe un email: "Tu referido Veterinaria San Angel se suscribio"
- Admin recibe un email con el desglose completo
- La comision aparece como "Pendiente" en el panel

---

## Descuentos para clinicas referidas (opcional)

Al crear un codigo de referido, se puede agregar un descuento para la clinica:

- **Descuento (%)**: Porcentaje de descuento (ej: 10%)
- **Meses**: Cuantos meses dura el descuento (ej: 3 meses)
- **Cupon de Stripe**: ID del cupon creado en Stripe (necesario para que funcione)

**Importante:** Para que el descuento funcione, primero hay que crear el cupon en el dashboard de Stripe y copiar el ID al campo "stripeCouponId".

---

## Panel de estadisticas

En la parte superior de **Admin > Referidos** se ven:

| Metrica | Que significa |
|---------|--------------|
| Partners Activos | Cuantos partners estan activos referiendo |
| Conversiones | Cuantas clinicas referidas ya pagaron (con tasa de conversion) |
| Comisiones Pendientes | Dinero que se debe a partners |
| Total Pagado | Dinero total que ya se pago a partners |

---

## Detalle por partner

Click en el icono de ojo en cualquier partner para ver:
- Su informacion de contacto
- Todos sus codigos de referido (con clicks de cada uno)
- Historial completo de conversiones
- Comision total generada
- Monto pendiente de pago
- Acciones rapidas para aprobar/pagar comisiones

---

## Preguntas frecuentes

**¿Que pasa si la clinica no uso el link pero si le dieron el codigo?**
El codigo se puede pasar manualmente durante el registro. Si la clinica no lo ingreso, la atribucion no se registra automaticamente. En ese caso, se tendria que registrar manualmente en la base de datos.

**¿Que pasa si una clinica cancela su suscripcion?**
La conversion se marca como "Cancelado" (CHURNED). Si la comision ya se pago, no se recupera automaticamente — hay que decidir caso por caso.

**¿Un partner puede tener varios codigos?**
Si. Se pueden crear codigos diferentes para distintas ciudades, campanas, o canales. Cada codigo trackea sus propios clicks y conversiones.

**¿Se puede cambiar el porcentaje de comision?**
Si, editando el partner. El cambio aplica para futuras conversiones. Las comisiones ya calculadas mantienen el porcentaje que tenian al momento de la conversion.

**¿La comision es sobre el primer pago o recurrente?**
En la Fase 1, la comision se calcula sobre el primer pago unicamente. Para comisiones recurrentes, se necesitaria la Fase 2 del sistema.

**¿Como le pago al partner?**
En la Fase 1, el pago es manual (transferencia bancaria, deposito, etc.). Se marca como pagado en el panel y se agrega una nota con la referencia. En la Fase 2 se podria automatizar con Stripe Connect.

**¿El partner necesita cuenta en Vetify?**
No. En la Fase 1, el partner no tiene acceso al sistema. Todo se gestiona desde el panel de admin. En la Fase 2 se le daria un portal de self-service.

---

## Acuerdo recomendado con el partner

Antes de activar un partner, se recomienda tener un acuerdo (aunque sea informal) que cubra:

1. **Porcentaje de comision** y sobre que base se calcula
2. **Frecuencia de pago** (mensual, al acumularse X monto, etc.)
3. **Periodo de validez** (comision solo por el primer pago, o por X meses)
4. **Devolucion de comision** si la clinica cancela en los primeros 30-60 dias
5. **Exclusividad** o no sobre ciertas ciudades/regiones
6. **Capacitacion** — si el partner da capacitacion, definir si se paga por separado o esta incluida en la comision
7. **Facturacion** — el partner necesita emitir factura para deducibilidad fiscal
