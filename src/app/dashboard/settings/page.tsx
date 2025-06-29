import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { ServiceManagement } from '@/components/settings/ServiceManagement';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { user, tenant } = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Configuración ⚙️
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personaliza y configura tu clínica veterinaria
        </p>
      </div>

      {/* Servicios Médicos - Nueva sección */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xl">🏥</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Servicios Médicos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configura los servicios que ofrece tu clínica
              </p>
            </div>
          </div>
        </div>
        
        <ServiceManagement tenantId={tenant.id} />
      </div>

      {/* Configuración de Clínica */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-white text-xl">🏢</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Configuración de Clínica
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Información básica y horarios de atención
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Configura los datos de tu clínica, horarios de atención y información de contacto.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
              Configurar Clínica
            </button>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">🔔</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Notificaciones
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                WhatsApp, recordatorios y plantillas de mensajes
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Configura las notificaciones automáticas y personaliza las plantillas de mensajes.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
              Configurar Notificaciones
            </button>
          </div>
        </div>
      </div>

      {/* Roles y Permisos */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Roles y Permisos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestiona los roles del personal y sus permisos
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Define roles personalizados y asigna permisos específicos a cada miembro del equipo.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800">
              Gestionar Roles
            </button>
          </div>
        </div>
      </div>

      {/* Recordatorios de Tratamiento */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <span className="text-white text-xl">💉</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Recordatorios de Tratamiento
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatiza vacunas, desparasitaciones y tratamientos
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Configura recordatorios automáticos para tratamientos preventivos y vacunaciones.
            </p>
            <Link
              href="/dashboard/pets?tab=treatment-reminders"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              Ver Recordatorios
            </Link>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Información Actual
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {user.firstName || user.name} ({user.email})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Clínica
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {tenant.name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan Actual
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {tenant.planType === 'BASIC' ? 'Básico' : tenant.planType}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {tenant.status === 'ACTIVE' ? 'Activo' : tenant.status}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400">🔔</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              ¿Necesitas ayuda con la configuración?
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Si necesitas ayuda configurando tus servicios o alguna otra funcionalidad, contáctanos.
            </p>
            <div className="mt-2">
              <Link
                href="/contacto"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
              >
                Ir a Contacto →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 