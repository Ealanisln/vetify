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

      {/* Configuración Futura - Mantenemos el preview */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-[#75a99c] to-[#5b9788] mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Más Configuraciones Próximamente
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xl mx-auto">
              Estamos desarrollando más opciones de configuración para optimizar tu clínica.
            </p>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">👤</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm">
                  Perfil de Usuario
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Datos personales y preferencias
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🔔</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm">
                  Notificaciones
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  WhatsApp, email y recordatorios
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🎨</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm">
                  Personalización
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tema, colores y configuración
                </p>
              </div>
            </div>
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