'use client';

import { Pet, Customer } from '@prisma/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getThemeClasses } from '../../utils/theme-colors';

type PetWithCustomer = Pet & { customer: Customer };

interface QuickActionsCardProps {
  pet: PetWithCustomer;
}

export function QuickActionsCard({ pet }: QuickActionsCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (actionType: string) => {
    setIsLoading(actionType);
    
    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switch (actionType) {
      case 'consultation':
        router.push(`/dashboard/pets/${pet.id}/consultation/new`);
        break;
      case 'treatment':
        router.push(`/dashboard/pets/${pet.id}/treatment/new`);
        break;
      case 'vaccination':
        router.push(`/dashboard/pets/${pet.id}/vaccination/new`);
        break;
      case 'vitals':
        router.push(`/dashboard/pets/${pet.id}/vitals/new`);
        break;
      case 'appointment':
        router.push(`/dashboard/appointments/new?petId=${pet.id}&customerId=${pet.customer.id}`);
        break;
      case 'whatsapp':
        if (pet.customer?.phone) {
          window.open(`https://wa.me/${pet.customer.phone.replace(/\D/g, '')}`, '_blank');
        } else {
          alert('No hay número de WhatsApp registrado');
        }
        break;
      case 'images':
        alert('Abriendo galería de imágenes...');
        break;
    }
    
    setIsLoading(null);
  };

  const actions = [
    {
      id: 'consultation',
      name: 'Nueva Consulta',
      description: 'Registrar visita médica',
      icon: '🩺',
      primary: true,
      color: 'blue'
    },
    {
      id: 'treatment',
      name: 'Agregar Tratamiento',
      description: 'Medicamentos y terapias',
      icon: '💊',
      primary: false,
      color: 'green'
    },
    {
      id: 'vaccination',
      name: 'Registrar Vacuna',
      description: 'Aplicar vacunación',
      icon: '💉',
      primary: false,
      color: 'purple'
    },
    {
      id: 'vitals',
      name: 'Signos Vitales',
      description: 'Peso, temperatura, etc.',
      icon: '🩺',
      primary: false,
      color: 'orange'
    },
    {
      id: 'appointment',
      name: 'Agendar Cita',
      description: 'Programar próxima visita',
      icon: '📅',
      primary: false,
      color: 'gray'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Contactar al dueño',
      icon: '💬',
      primary: false,
      color: 'gray'
    }
  ];

  const getActionStyles = (action: typeof actions[0]) => {
    if (action.primary) {
      return `${getThemeClasses('background.card')} border-2 border-[#75a99c] dark:border-[#95c9bc] hover:${getThemeClasses('background.hover')}`;
    }
    
    switch (action.color) {
      case 'green':
        return `${getThemeClasses('background.card', 'border.card')} hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700`;
      case 'purple':
        return `${getThemeClasses('background.card', 'border.card')} hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700`;
      case 'orange':
        return `${getThemeClasses('background.card', 'border.card')} hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-700`;
      default:
        return `${getThemeClasses('background.card', 'border.card')} hover:${getThemeClasses('background.hover')}`;
    }
  };

  const getTextStyles = (action: typeof actions[0]) => {
    if (action.primary) {
      return {
        name: 'text-[#75a99c] dark:text-[#95c9bc]',
        description: 'text-[#5f8c7f] dark:text-[#7bb3a5]'
      };
    }
    
    switch (action.color) {
      case 'green':
        return {
          name: `${getThemeClasses('text.primary')} group-hover:text-green-900 dark:group-hover:text-green-200`,
          description: `${getThemeClasses('text.tertiary')} group-hover:text-green-700 dark:group-hover:text-green-300`
        };
      case 'purple':
        return {
          name: `${getThemeClasses('text.primary')} group-hover:text-purple-900 dark:group-hover:text-purple-200`,
          description: `${getThemeClasses('text.tertiary')} group-hover:text-purple-700 dark:group-hover:text-purple-300`
        };
      case 'orange':
        return {
          name: `${getThemeClasses('text.primary')} group-hover:text-orange-900 dark:group-hover:text-orange-200`,
          description: `${getThemeClasses('text.tertiary')} group-hover:text-orange-700 dark:group-hover:text-orange-300`
        };
      default:
        return {
          name: getThemeClasses('text.primary'),
          description: getThemeClasses('text.tertiary')
        };
    }
  };

  return (
    <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
      <h3 className={`text-base md:text-lg font-medium ${getThemeClasses('text.primary')} mb-4`}>
        Acciones Rápidas
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => {
          const textStyles = getTextStyles(action);
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isLoading === action.id}
              className={`group relative rounded-lg p-3 text-left transition-all duration-200 ${getActionStyles(action)} ${
                isLoading === action.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${textStyles.name} truncate`}>
                    {action.name}
                  </p>
                  <p className={`text-xs transition-colors ${textStyles.description} truncate`}>
                    {action.description}
                  </p>
                </div>
                {isLoading === action.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-[#75a99c]"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 