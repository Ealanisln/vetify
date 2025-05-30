"use client";

import { useState } from 'react';
import { Check, Play, MessageCircle, Zap, Users } from 'lucide-react';
import { useTheme } from "next-themes";

const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const { resolvedTheme } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to registration with email
    window.location.href = `/registro?email=${encodeURIComponent(email)}`;
  };

  const handleDemoClick = () => {
    // Scroll to demo section or open demo modal
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Enhanced background with more modern gradient */}
      <div 
        className={`absolute inset-0 z-0 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/60"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      />
      
      {/* Modern geometric background decorations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-green-400 to-blue-500 blur-3xl opacity-15 dark:opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 blur-3xl opacity-15 dark:opacity-5"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Main content */}
          <div>
            {/* New launch badge with special offer */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full mb-6 border border-green-200 dark:border-green-700">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                🚀 LANZAMIENTO: 35% OFF en planes anuales
              </span>
            </div>
            
            {/* Updated headline based on the USP */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
              El primer CRM veterinario con{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                WhatsApp automático
              </span>{' '}
              incluido
            </h1>
            
            {/* Updated value proposition */}
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Automatiza recordatorios, gestiona pacientes y aumenta tus ingresos 30% con el software veterinario más moderno de México. <span className="font-semibold text-gray-900 dark:text-white">Setup en 15 minutos.</span>
            </p>
            
            {/* Key benefits with icons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">WhatsApp automático nativo</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Plan GRATIS real (no trial)</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">50% más barato que competencia</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Setup instantáneo vs 6 semanas</span>
              </div>
            </div>
            
            {/* CTA Section */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              {/* Email form */}
              <form onSubmit={handleSubmit} className="flex flex-1">
                <div className="flex-1">
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full px-4 py-3 rounded-l-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm text-base placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-r-xl"
                >
                  Probar GRATIS
                </button>
              </form>
              
              {/* Demo button */}
              <button
                onClick={handleDemoClick}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-2" />
                Ver Demo
              </button>
            </div>
            
            {/* Trust badges - updated */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center mb-2 sm:mb-0">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="sm:ml-6 flex items-center mb-2 sm:mb-0">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span>Cancela cuando quieras</span>
              </div>
              <div className="sm:ml-6 flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span>Soporte en español 24/7</span>
              </div>
            </div>

            {/* Social proof */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Ya confían en Vetify:
              </p>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Veterinarios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">15,000+</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Mascotas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Satisfacción</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced visual section */}
          <div className="lg:pl-8 hidden lg:block">
            <div className="relative">
              {/* WhatsApp notification mockup */}
              <div className="absolute -left-6 top-12 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 flex items-start z-10 max-w-sm border border-gray-100 dark:border-gray-700">
                <div className="bg-green-500 rounded-full p-2 mr-3 flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">WhatsApp Automático</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Ahora</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    🎉 ¡Hola! Firulais tiene cita mañana a las 10:00 AM para su vacuna anual...
                  </p>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Enviado automáticamente
                  </div>
                </div>
              </div>
              
              {/* ROI badge */}
              <div className="absolute -right-4 bottom-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-4 z-10 text-white max-w-48">
                <div className="flex items-center mb-2">
                  <Zap className="h-5 w-5 mr-2" />
                  <span className="font-semibold text-sm">ROI Comprobado</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Ingresos:</span>
                    <span className="font-bold">+30%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tiempo ahorrado:</span>
                    <span className="font-bold">5h/semana</span>
                  </div>
                </div>
              </div>
              
              {/* Dashboard mockup */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-16 flex items-center px-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="ml-4 text-white font-semibold">Vetify Dashboard</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">47</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Citas hoy</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">89%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Satisfacción</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 