# Vetify - CRM Veterinario SaaS

Una plataforma moderna de gestión veterinaria en la nube que simplifica la administración de clínicas veterinarias y mejora la atención de las mascotas.

## 🐾 Descripción

Vetify es una solución SaaS integral diseñada específicamente para clínicas veterinarias que buscan modernizar y optimizar sus operaciones. Nuestra plataforma combina la gestión de pacientes, historiales clínicos, inventario y facturación en una interfaz intuitiva y fácil de usar.

## ✨ Características Principales

- **Gestión de Pacientes**: Registro completo de mascotas con historiales médicos digitales, vacunaciones y tratamientos. Incluye sistema de recordatorios y alertas para seguimientos médicos.
- **Agenda Inteligente**: Sistema de citas con recordatorios automáticos vía email y SMS. Optimización automática de horarios y gestión de disponibilidad por veterinario.
- **Control de Inventario**: Seguimiento en tiempo real de medicamentos, productos y equipamiento. Sistema de alertas para stock bajo y fechas de caducidad.
- **Facturación Integrada**: Generación automática de facturas, múltiples métodos de pago y gestión de seguros veterinarios.
- **Reportes y Análisis**: Dashboard personalizable con métricas clave, análisis de tendencias y reportes exportables.
- **Interfaz Responsiva**: Diseño adaptativo optimizado para todos los dispositivos, con soporte offline para funciones básicas.

## 🚀 Estado del Proyecto

Actualmente en Beta - v0.1.0

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - Next.js 15
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI
  - Zustand (state management)

- **Backend**:
  - Next.js API Routes
  - Prisma ORM
  - tRPC
  - NextAuth.js

- **Base de Datos**:
  - PostgreSQL
  - Redis (caché)

- **Infraestructura**:
  - Vercel
  - Supabase
  - AWS S3 (almacenamiento)

## 🔧 Requisitos Previos

- Node.js 18.17 o superior
- pnpm 8.x
- PostgreSQL 14+
- Variables de entorno configuradas (ver `.env.example`)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Ealanisln/vetify.git

# Entrar al directorio
cd vetify

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar migraciones
pnpm prisma migrate dev

# Iniciar servidor de desarrollo
pnpm dev
```

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, lee nuestro [CONTRIBUTING.md](CONTRIBUTING.md) para conocer el proceso de envío de pull requests.

### Guías de Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Contacto

- Website: www.vetify.pro
- Email: contacto@vetify.pro
- Twitter: Próximamente

