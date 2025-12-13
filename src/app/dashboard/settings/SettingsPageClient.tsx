'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ServiceManagement } from '../../../components/settings/ServiceManagement';
import { BusinessHoursSettings } from '../../../components/settings/BusinessHoursSettings';
import { NotificationSettings } from '../../../components/settings/NotificationSettings';
import { SubscriptionManager } from '../../../components/subscription';
import type { TenantWithPlan } from '@/types';
import {
  Settings,
  Wrench,
  Clock,
  Bell,
  Users,
  Shield,
  Building2,
  CreditCard,
  Globe
} from 'lucide-react';
import { PublicPageSettings } from '../../../components/settings/PublicPageSettings';

const settingsSections = [
  {
    id: 'public-page',
    title: 'Página Pública',
    description: 'Configura la landing page de tu clínica',
    icon: Globe,
    component: 'public-page'
  },
  {
    id: 'business-hours',
    title: 'Horarios de Atención',
    description: 'Configure los días y horarios de trabajo de su clínica',
    icon: Clock,
    component: 'business-hours'
  },
  {
    id: 'services',
    title: 'Servicios',
    description: 'Gestione los servicios que ofrece su clínica',
    icon: Wrench,
    component: 'services'
  },
  {
    id: 'subscription',
    title: 'Subscripción y Facturación',
    description: 'Gestione su plan y métodos de pago',
    icon: CreditCard,
    component: 'subscription'
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Configure recordatorios y alertas automáticas',
    icon: Bell,
    component: 'notifications'
  },
  {
    id: 'staff',
    title: 'Personal',
    description: 'Gestione roles y permisos del personal',
    icon: Users,
    component: 'staff',
    comingSoon: true
  },
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Configure la seguridad y autenticación',
    icon: Shield,
    component: 'security',
    comingSoon: true
  },
  {
    id: 'clinic-info',
    title: 'Información de la Clínica',
    description: 'Actualice los datos de su clínica',
    icon: Building2,
    component: 'clinic-info',
    comingSoon: true
  }
];

interface SettingsPageClientProps {
  tenant: TenantWithPlan;
}

export function SettingsPageClient({ tenant }: SettingsPageClientProps) {
  const [activeSection, setActiveSection] = useState('public-page'); // Empezamos en página pública por defecto

  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'public-page':
        return <PublicPageSettings tenantId={tenant.id} />;
      case 'business-hours':
        return <BusinessHoursSettings tenantId={tenant.id} />;
      case 'services':
        return <ServiceManagement tenantId={tenant.id} />;
      case 'subscription':
        return <SubscriptionManager tenant={tenant} />;
      case 'notifications':
        return <NotificationSettings tenantId={tenant.id} />;
      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Próximamente
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Esta sección estará disponible pronto.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gestiona la configuración de tu clínica veterinaria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-none transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      } ${section.comingSoon ? 'opacity-60' : ''}`}
                      disabled={section.comingSoon}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {section.title}
                          {section.comingSoon && (
                            <Badge variant="secondary" className="text-xs">
                              Próximamente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const currentSection = settingsSections.find(s => s.id === activeSection);
                  const Icon = currentSection?.icon || Settings;
                  return (
                    <>
                      <Icon className="h-5 w-5" />
                      {currentSection?.title || 'Configuración'}
                    </>
                  );
                })()}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </CardHeader>
            <CardContent>
              {renderActiveComponent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 