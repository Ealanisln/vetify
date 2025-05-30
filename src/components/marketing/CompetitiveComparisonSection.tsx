import React from 'react';
import { Check, X, Zap, Clock, DollarSign, MessageCircle } from 'lucide-react';

interface CompetitorFeature {
  name: string;
  vetify: boolean | string;
  vetpraxis: boolean | string;
  easyvet: boolean | string;
  vetcloud: boolean | string;
  highlight?: boolean;
}

const competitorData: CompetitorFeature[] = [
  {
    name: 'Precio mensual (MXN)',
    vetify: '$0 - $2,999',
    vetpraxis: '$2,500 - $4,000',
    easyvet: '$1,800 - $3,500',
    vetcloud: '$1,200 - $2,800',
    highlight: true
  },
  {
    name: 'WhatsApp Automático',
    vetify: true,
    vetpraxis: false,
    easyvet: 'Terceros',
    vetcloud: false,
    highlight: true
  },
  {
    name: 'Setup Fee',
    vetify: '$0',
    vetpraxis: '$5,000+',
    easyvet: '$3,000+',
    vetcloud: '$2,000+',
    highlight: true
  },
  {
    name: 'Tiempo de implementación',
    vetify: '15 minutos',
    vetpraxis: '6+ semanas',
    easyvet: '4+ semanas',
    vetcloud: '3+ semanas',
    highlight: true
  },
  {
    name: 'Plan gratuito',
    vetify: true,
    vetpraxis: false,
    easyvet: false,
    vetcloud: false
  },
  {
    name: 'Automatización nativa',
    vetify: true,
    vetpraxis: false,
    easyvet: false,
    vetcloud: false
  },
  {
    name: 'Soporte en español',
    vetify: '24/7',
    vetpraxis: 'Limitado',
    easyvet: 'Horario',
    vetcloud: 'Email'
  }
];

export const CompetitiveComparisonSection: React.FC = () => {
  const renderValue = (value: boolean | string, isVetify: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`h-5 w-5 mx-auto ${isVetify ? 'text-green-600' : 'text-green-500'}`} />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    
    return (
      <span className={`text-sm font-medium ${
        isVetify ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {value}
      </span>
    );
  };

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <Zap className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              COMPARACIÓN REAL: Vetify vs Competencia
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Por qué elegir Vetify sobre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              la competencia?
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Comparamos Vetify con los principales competidores mexicanos. 
            <span className="font-semibold text-gray-900 dark:text-white"> Los números hablan por sí solos.</span>
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Característica
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex flex-col items-center">
                      <span>🚀 VETIFY</span>
                      <span className="text-xs font-normal text-blue-500 dark:text-blue-300 mt-1">
                        (Nuestra solución)
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    VetPraxis
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    easyVet
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    VetCloud
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {competitorData.map((feature, index) => (
                  <tr 
                    key={index}
                    className={`${
                      feature.highlight 
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500' 
                        : index % 2 === 0 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-900/20'
                    } hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {feature.highlight && (
                          <Zap className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {feature.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center bg-blue-50 dark:bg-blue-900/20">
                      {renderValue(feature.vetify, true)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderValue(feature.vetpraxis)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderValue(feature.easyvet)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderValue(feature.vetcloud)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              50% más barato
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Que VetPraxis con todas las funciones incluidas
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Setup instantáneo
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              15 minutos vs 6+ semanas de la competencia
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              WhatsApp nativo
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatización que la competencia no puede copiar
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              ¿Listo para cambiar a la mejor opción?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Únete a los 500+ veterinarios que ya eligieron Vetify sobre la competencia.
            </p>
            <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              Comenzar gratis ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveComparisonSection; 