import React, { useState } from 'react';
import { Play, MessageCircle, Clock, CheckCircle, Zap } from 'lucide-react';

export const WhatsAppDemoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: "Registra una mascota nueva",
      description: "Llena el formulario rápido con los datos del paciente",
      icon: <CheckCircle className="h-6 w-6" />,
      time: "30 segundos"
    },
    {
      title: "Presiona 'Guardar'",
      description: "El sistema procesa la información automáticamente",
      icon: <Zap className="h-6 w-6" />,
      time: "Instantáneo"
    },
    {
      title: "¡WhatsApp automático!",
      description: "El dueño recibe un mensaje de bienvenida automático",
      icon: <MessageCircle className="h-6 w-6" />,
      time: "5 segundos",
      highlight: true
    }
  ];

  const handlePlayDemo = () => {
    setIsPlaying(true);
    // Simulate demo steps
    demoSteps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        if (index === demoSteps.length - 1) {
          setTimeout(() => setIsPlaying(false), 2000);
        }
      }, index * 2000);
    });
  };

  return (
    <section id="demo-section" className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              DEMO EN VIVO: WhatsApp Automático
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            El momento mágico que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              cambia todo
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Ve cómo Vetify envía WhatsApp automático a los dueños cuando registras una mascota nueva. 
            <span className="font-semibold text-gray-900 dark:text-white"> La competencia no puede hacer esto.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Demo en 3 pasos simples:
            </h3>
            
            {demoSteps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start p-6 rounded-2xl transition-all duration-500 ${
                  isPlaying && currentStep === index
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500 shadow-lg scale-105'
                    : step.highlight
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                } hover:shadow-lg`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  step.highlight 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {step.time}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                  {step.highlight && (
                    <div className="mt-3 inline-flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      ¡Esto vuela la cabeza de los veterinarios!
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* CTA Button */}
            <div className="pt-6">
              <button
                onClick={handlePlayDemo}
                disabled={isPlaying}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-200 ${
                  isPlaying 
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105'
                }`}
              >
                <Play className="h-6 w-6 mr-3" />
                {isPlaying ? 'Demo en progreso...' : 'Ver Demo Interactivo'}
              </button>
            </div>
          </div>

          {/* Visual Demo */}
          <div className="relative">
            {/* Phone Mockup */}
            <div className="relative mx-auto max-w-sm">
              <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden">
                  {/* Phone Header */}
                  <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">WhatsApp</span>
                    </div>
                  </div>
                  
                  {/* Chat Interface */}
                  <div className="h-96 bg-white dark:bg-gray-900 p-4 space-y-4">
                    {/* Veterinary Logo */}
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">V</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Clínica Los Ángeles</div>
                        <div className="text-sm text-green-500">en línea</div>
                      </div>
                    </div>
                    
                    {/* Automatic Message */}
                    <div className={`transition-all duration-1000 ${
                      isPlaying && currentStep >= 2 ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
                    }`}>
                      <div className="bg-blue-500 text-white rounded-2xl rounded-bl-md p-4 max-w-xs">
                        <div className="text-sm leading-relaxed">
                          🎉 ¡Bienvenido a Clínica Los Ángeles!
                          <br /><br />
                          🐕 <strong>Firulais</strong> ya está registrado en nuestro sistema Vetify.
                          <br /><br />
                          ✅ Recibirás recordatorios automáticos de vacunas<br />
                          ✅ Historial médico digitalizado<br />
                          ✅ Comunicación directa con el veterinario
                          <br /><br />
                          ¿Alguna pregunta? Solo responde a este mensaje.
                        </div>
                        <div className="text-xs opacity-75 mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Enviado automáticamente por Vetify
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center justify-center mt-6">
                      <div className={`flex items-center space-x-2 text-sm ${
                        isPlaying && currentStep >= 2 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <CheckCircle className="h-4 w-4" />
                        <span>Entregado automáticamente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating "WOW" reaction */}
              {isPlaying && currentStep >= 2 && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-2 rounded-full font-bold text-sm animate-bounce shadow-lg">
                  🤯 ¡WOW!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              &ldquo;¿¿¿Cómo hiciste eso???&rdquo;
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
              Esta es la reacción de <strong>TODOS</strong> los veterinarios cuando ven el WhatsApp automático. 
              La competencia mexicana no puede hacer esto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-300">Veterinarios impactados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">98%</div>
                <div className="text-gray-600 dark:text-gray-300">Piden precio inmediatamente</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">15min</div>
                <div className="text-gray-600 dark:text-gray-300">Setup vs 6 semanas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppDemoSection; 