'use client';

import { Pet, Customer } from '@prisma/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        alert('Abriendo calendario...');
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
      return 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100';
    }
    
    switch (action.color) {
      case 'green':
        return 'border border-gray-200 hover:bg-green-50 hover:border-green-200';
      case 'purple':
        return 'border border-gray-200 hover:bg-purple-50 hover:border-purple-200';
      case 'orange':
        return 'border border-gray-200 hover:bg-orange-50 hover:border-orange-200';
      default:
        return 'border border-gray-200 hover:bg-gray-50';
    }
  };

  const getTextStyles = (action: typeof actions[0]) => {
    if (action.primary) {
      return {
        name: 'text-blue-900',
        description: 'text-blue-700'
      };
    }
    
    switch (action.color) {
      case 'green':
        return {
          name: 'text-gray-900 group-hover:text-green-900',
          description: 'text-gray-500 group-hover:text-green-700'
        };
      case 'purple':
        return {
          name: 'text-gray-900 group-hover:text-purple-900',
          description: 'text-gray-500 group-hover:text-purple-700'
        };
      case 'orange':
        return {
          name: 'text-gray-900 group-hover:text-orange-900',
          description: 'text-gray-500 group-hover:text-orange-700'
        };
      default:
        return {
          name: 'text-gray-900',
          description: 'text-gray-500'
        };
    }
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors ${textStyles.name}`}>
                      {action.name}
                    </p>
                    <p className={`text-xs transition-colors ${textStyles.description}`}>
                      {action.description}
                    </p>
                  </div>
                  {isLoading === action.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 