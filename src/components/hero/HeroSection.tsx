"use client";

import { useState } from 'react';
import { Check, Zap, MessageCircle, Shield } from 'lucide-react';
import { useThemeAware } from "@/hooks/useThemeAware";

const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const { mounted, isDark } = useThemeAware();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/registro?email=${encodeURIComponent(email)}`;
  };

  // Safe theme-aware class selection
  const backgroundClass = mounted && isDark
    ? "bg-gradient-to-b from-vetify-primary-800/30 to-vetify-slate-900/50"
    : "bg-gradient-to-b from-vetify-primary-50 to-white";

  return (
    <div className="relative overflow-hidden">
      {/* Fondo con gradiente adaptado a light/dark mode */}
      <div className={`absolute inset-0 z-0 ${backgroundClass}`} />
      
      {/* Decoración de fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-vetify-accent-200 blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-vetify-blush-100 blur-3xl opacity-20 dark:opacity-5"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Contenido principal */}
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-vetify-accent-50 dark:bg-vetify-accent-900/30 rounded-full mb-6">
              <Zap className="h-4 w-4 text-vetify-accent-600 dark:text-vetify-accent-300 mr-2" />
              <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">El primer software veterinario GRATIS con WhatsApp automático</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
              <span className="text-vetify-accent-500 dark:text-vetify-accent-300">Vetify:</span> El CRM que automatiza tu <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica veterinaria</span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-500 dark:text-gray-300 max-w-2xl">
              <strong>Recordatorios automáticos = más clientes contentos.</strong> Reduce 5 horas de trabajo manual por semana con automatización inteligente.
            </p>
            
            {/* Formulario CTA */}
            <form onSubmit={handleSubmit} className="mt-8 sm:flex max-w-md">
              <div className="min-w-0 flex-1">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm text-base placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vetify-accent-500 focus:border-vetify-accent-500"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <button
                  type="submit"
                  className="block w-full rounded-md px-4 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 text-base font-medium text-white shadow hover:shadow-lg transition-all duration-200"
                >
                  Comenzar GRATIS
                </button>
              </div>
            </form>
            
            {/* Trust badges */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-500 dark:text-gray-300">
              <div className="flex items-center mb-2 sm:mb-0">
                <Check className="h-4 w-4 text-vetify-success mr-1" />
                <span>Setup en 15 minutos</span>
              </div>
              <div className="sm:ml-6 flex items-center mb-2 sm:mb-0">
                <Check className="h-4 w-4 text-vetify-success mr-1" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="sm:ml-6 flex items-center">
                <Check className="h-4 w-4 text-vetify-success mr-1" />
                <span>Soporte incluido</span>
              </div>
            </div>
          </div>
          
          {/* Imagen o preview */}
          <div className="md:pl-8 hidden md:block">
            <div className="relative">
              {/* Badge flotante 1 - WhatsApp */}
              <div className="absolute -left-6 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center z-10">
                <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-2 mr-3">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp automático</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">90% menos vacunas olvidadas</p>
                </div>
              </div>
              
              {/* Badge flotante 2 - Emergencias */}
              <div className="absolute -right-4 bottom-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10">
                <div className="flex items-center">
                  <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-2 mr-3">
                    <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Respuesta menor a 2 min</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">en emergencias</p>
                  </div>
                </div>
              </div>
              
              {/* Screenshot principal */}
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="h-6 bg-gray-50 dark:bg-gray-900 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="w-full">
                  <object 
                    type="image/svg+xml" 
                    data="/dashboard-preview.svg" 
                    className="w-full"
                    aria-label="Dashboard Vetify"
                  >
                    <div className="w-full h-60 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <p className="text-gray-600 dark:text-gray-300">Vista previa del dashboard</p>
                    </div>
                  </object>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature highlights strip - Top 3 Workflows MVP */}
      <div className="relative z-10 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Los 3 workflows que transformarán tu clínica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatización inteligente para máximo impacto
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Magic Vaccination Assistant</h3>
                <p className="mt-1 text-sm font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-1 rounded-full inline-block border border-green-200 dark:border-green-600">90% reducción en vacunas olvidadas</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nunca más olvides una vacuna con recordatorios automáticos por WhatsApp.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Emergency Response Protocol</h3>
                <p className="mt-1 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-2 py-1 rounded-full inline-block border border-red-200 dark:border-red-600">Respuesta menor a 2 minutos</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Respuesta automática en emergencias con alerta a todo el equipo.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Smart Inventory Guardian</h3>
                <p className="mt-1 text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full inline-block border border-blue-200 dark:border-blue-600">30% reducción de costos</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nunca te quedes sin medicamentos críticos con IA predictiva.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 