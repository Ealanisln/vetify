"use client";

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from "next-themes";

const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const { resolvedTheme } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes manejar la lógica para registrar el email
    // y redirigir al usuario al proceso de registro
    window.location.href = `/registro?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Fondo con gradiente adaptado a light/dark mode */}
      <div 
        className={`absolute inset-0 z-0 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-vetify-primary-800/30 to-vetify-slate-900/50"
            : "bg-gradient-to-b from-vetify-primary-50 to-white"
        }`}
      />
      
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
              <span className="text-sm font-medium text-vetify-accent-600 dark:text-vetify-accent-300">Nuevo: Plan Básico desde $349 MXN/mes</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
              El software que toda <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica veterinaria</span> necesita
            </h1>
            
            <p className="mt-6 text-xl text-gray-500 dark:text-gray-300 max-w-2xl">
              Gestiona pacientes, citas, inventario y facturación en un solo lugar. 
              Diseñado para veterinarios que quieren crecer y brindar un mejor servicio.
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
                  Prueba gratuita
                </button>
              </div>
            </form>
            
            {/* Trust badges */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-500 dark:text-gray-300">
              <div className="flex items-center mb-2 sm:mb-0">
                <Check className="h-4 w-4 text-vetify-success mr-1" />
                <span>14 días gratis</span>
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
              {/* Badge flotante 1 */}
              <div className="absolute -left-6 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center z-10">
                <div className="bg-vetify-success/20 rounded-full p-2 mr-3">
                  <span className="h-6 w-6 text-vetify-success flex items-center justify-center font-bold">+</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">20% más pacientes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">en los primeros 3 meses</p>
                </div>
              </div>
              
              {/* Badge flotante 2 */}
              <div className="absolute -right-4 bottom-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10">
                <div className="flex items-center">
                  <div className="bg-vetify-accent-100 dark:bg-vetify-accent-900/50 rounded-full p-2 mr-3">
                    <span className="h-6 w-6 text-vetify-accent-600 dark:text-vetify-accent-400 flex items-center justify-center font-bold">-</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">30% menos tiempo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">en tareas administrativas</p>
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
      
      {/* Feature highlights strip */}
      <div className="relative z-10 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-vetify-accent-500 text-white">
                  {/* Icono 1 */}
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Expedientes digitales</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Historial médico completo y accesible para todas tus mascotas.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-vetify-accent-500 text-white">
                  {/* Icono 2 */}
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Agenda inteligente</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona citas y envía recordatorios automáticos a tus clientes.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-vetify-accent-500 text-white">
                  {/* Icono 3 */}
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Métricas y reportes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Conoce el desempeño de tu clínica con informes detallados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 