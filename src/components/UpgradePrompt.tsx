import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowUpIcon, LockIcon } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  // Note: 'automations' removed as it's a future feature
  feature: 'advancedReports' | 'multiDoctor' | 'smsReminders';
  tenantId: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const featureConfig = {
  // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
  // automations: {
  //   title: 'Automatizaciones',
  //   description: 'Automatiza recordatorios y notificaciones para tus clientes',
  //   icon: '🤖',
  //   benefit: 'Ahorra tiempo y mejora la comunicación con tus clientes'
  // },
  advancedReports: {
    title: 'Reportes Avanzados',
    description: 'Obtén insights detallados sobre tu clínica veterinaria',
    icon: '📊',
    benefit: 'Toma decisiones informadas con datos precisos'
  },
  multiDoctor: {
    title: 'Agenda Multi-Doctor',
    description: 'Gestiona citas para múltiples veterinarios',
    icon: '👥',
    benefit: 'Optimiza la agenda de todo tu equipo médico'
  },
  smsReminders: {
    title: 'Recordatorios SMS',
    description: 'Envía recordatorios por mensaje de texto',
    icon: '📱',
    benefit: 'Reduce las faltas a citas y mejora la asistencia'
  }
};

export function UpgradePrompt({ 
  feature, 
  tenantId,
  size = 'md',
  showIcon = true 
}: UpgradePromptProps) {
  // Future: Use tenantId for tracking upgrade events
  void tenantId;
  const config = featureConfig[feature];
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <Card className={`border-dashed border-2 border-amber-200 bg-amber-50 ${sizeClasses[size]}`}>
      <div className="text-center space-y-4">
        {showIcon && (
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">{config.icon}</span>
            <LockIcon className="h-5 w-5 text-amber-600" />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h3 className="font-semibold text-gray-900">{config.title}</h3>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              Pro Feature
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600">
            {config.description}
          </p>
          
          <p className="text-xs text-amber-700 font-medium">
            {config.benefit}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/precios">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Button>
          </Link>
          
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              Ver Límites del Plan
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

/**
 * Compact version for inline usage
 */
export function UpgradePromptInline({ 
  feature, 
  tenantId 
}: Pick<UpgradePromptProps, 'feature' | 'tenantId'>) {
  const config = featureConfig[feature];
  // Future: Use tenantId for tracking upgrade events
  void tenantId;
  
  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm">
      <LockIcon className="h-3 w-3 text-amber-600" />
      <span className="text-amber-800">
        {config.title} - 
                 <Link href="/precios" className="text-amber-700 hover:text-amber-800 underline font-medium">
           Actualizar
         </Link>
      </span>
    </div>
  );
}

/**
 * Banner version for page-wide notifications
 */
export function UpgradePromptBanner({ 
  feature, 
  tenantId 
}: Pick<UpgradePromptProps, 'feature' | 'tenantId'>) {
  const config = featureConfig[feature];
  // Future: Use tenantId for tracking upgrade events
  void tenantId;
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
              <LockIcon className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {config.title} requiere actualización
            </h4>
            <p className="text-sm text-gray-600">
              {config.benefit}
            </p>
          </div>
        </div>
        
        <Link href="/precios">
          <Button size="sm">
            Actualizar Plan
          </Button>
        </Link>
      </div>
    </div>
  );
} 