'use client';

import { Pet, User } from '@prisma/client';
import { useState } from 'react';

type PetWithUser = Pet & { user: User };

interface QuickActionsCardProps {
  pet: PetWithUser;
}

export function QuickActionsCard({ pet }: QuickActionsCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (actionType: string) => {
    setIsLoading(actionType);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (actionType) {
      case 'consultation':
        alert('Redirigiendo a nueva consulta...');
        break;
      case 'appointment':
        alert('Abriendo calendario...');
        break;
      case 'vaccination':
        alert('Abriendo formulario de vacunación...');
        break;
      case 'deworming':
        alert('Abriendo formulario de desparasitación...');
        break;
      case 'whatsapp':
        if (pet.user?.phone) {
          window.open(`https://wa.me/${pet.user.phone.replace(/\D/g, '')}`, '_blank');
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
      primary: true
    },
    {
      id: 'appointment',
      name: 'Agendar Cita',
      description: 'Programar próxima visita',
      icon: '📅',
      primary: false
    },
    {
      id: 'vaccination',
      name: 'Vacunar',
      description: 'Registrar vacunación',
      icon: '💉',
      primary: false
    },
    {
      id: 'deworming',
      name: 'Desparasitar',
      description: 'Aplicar tratamiento',
      icon: '🪱',
      primary: false
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Contactar al dueño',
      icon: '💬',
      primary: false
    },
    {
      id: 'images',
      name: 'Ver Imágenes',
      description: 'Radiografías y fotos',
      icon: '📸',
      primary: false
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isLoading === action.id}
              className={`relative rounded-lg p-3 text-left transition-all duration-200 ${
                action.primary 
                  ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100' 
                  : 'border border-gray-200 hover:bg-gray-50'
              } ${isLoading === action.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{action.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    action.primary ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {action.name}
                  </p>
                  <p className={`text-xs ${
                    action.primary ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {action.description}
                  </p>
                </div>
                {isLoading === action.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-600"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 