import React from 'react';
import { FAQItem } from './types';

const FAQ_ITEMS: FAQItem[] = [
  {
    question: '¿Puedo cambiar de plan después?',
    answer:
      'Sí, puedes actualizar o cambiar tu plan en cualquier momento desde la configuración de tu cuenta. Si actualizas, te cobraremos solo la diferencia prorrateada para el ciclo de facturación actual.',
  },
  {
    question: '¿Hay cargos ocultos o contratos?',
    answer:
      'No hay cargos ocultos ni contratos a largo plazo. Pagas mes a mes o año a año, y puedes cancelar cuando quieras. El único costo adicional podría ser por exceder el límite de SMS incluidos, si aplica.',
  },
  {
    question: '¿Qué sucede si excedo los límites de mi plan?',
    answer:
      'Te notificaremos proactivamente si te acercas a los límites (ej. usuarios, mascotas). Podrás actualizar fácilmente a un plan superior o contactarnos para discutir opciones si tus necesidades son muy específicas.',
  },
  {
    question: '¿Ofrecen un periodo de prueba gratuito?',
    answer:
      '¡Sí! Ofrecemos una prueba gratuita completa de 14 días en el Plan Estándar para que puedas explorar todas las funcionalidades sin compromiso. No necesitas tarjeta de crédito para empezar.',
  },
];

export const FAQSection: React.FC = () => {
  return (
    <div className="mb-16 max-w-4xl mx-auto">
      <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-gray-100 text-center mb-8">
        Preguntas Frecuentes
      </h3>

      <div className="space-y-5">
        {FAQ_ITEMS.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-5 sm:p-6"
          >
            <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              {item.question}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 