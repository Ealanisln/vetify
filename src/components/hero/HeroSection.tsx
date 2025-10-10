"use client";

import { useState } from 'react';
import { Check, Zap, MessageCircle, Shield } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/api/auth/register?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      {/* Decorative blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Contenido principal */}
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Zap className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">Software veterinario completo con 30 días gratis</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              <span className="text-primary">Vetify:</span> El CRM completo para <span className="text-primary">gestionar tu clínica</span>
            </h1>

            <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
              <strong className="text-foreground">Gestiona citas, historiales y clientes en un solo lugar.</strong> Todo lo que necesitas para administrar tu clínica veterinaria de manera profesional.
            </p>
            
            {/* Formulario CTA */}
            <form onSubmit={handleSubmit} className="mt-8 sm:flex max-w-md gap-3">
              <div className="min-w-0 flex-1">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input text-base py-3"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mt-3 sm:mt-0">
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto px-6 py-3 text-base whitespace-nowrap"
                >
                  Probar 30 días gratis
                </button>
              </div>
            </form>

            {/* Trust badges */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center text-sm text-muted-foreground gap-2 sm:gap-6">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-1.5" />
                <span>Setup en 15 minutos</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-1.5" />
                <span>30 días de prueba</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-1.5" />
                <span>Soporte incluido</span>
              </div>
            </div>
          </div>
          
          {/* Imagen o preview */}
          <div className="md:pl-8 hidden md:block">
            <div className="relative">
              {/* Badge flotante 1 - Recordatorios */}
              <div className="absolute -left-6 top-12 card shadow-lg p-3 flex items-center z-10">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sistema de recordatorios</p>
                  <p className="text-xs text-muted-foreground">Seguimiento de vacunas y tratamientos</p>
                </div>
              </div>

              {/* Badge flotante 2 - Gestión completa */}
              <div className="absolute -right-4 bottom-16 card shadow-lg p-3 z-10">
                <div className="flex items-center">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Gestión completa</p>
                    <p className="text-xs text-muted-foreground">Citas, historiales e inventario</p>
                  </div>
                </div>
              </div>

              {/* Screenshot principal */}
              <div className="rounded-2xl overflow-hidden">
                <object
                  type="image/svg+xml"
                  data="/dashboard-preview.svg"
                  className="w-full h-auto scale-125"
                  aria-label="Dashboard Vetify"
                >
                  <div className="w-full h-60 flex items-center justify-center">
                    <p className="text-muted-foreground">Vista previa del dashboard</p>
                  </div>
                </object>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature highlights strip - Core Features */}
      <div className="relative z-10 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Todo lo que necesitas para gestionar tu clínica
            </h3>
            <p className="text-sm text-muted-foreground">
              Sistema completo de gestión veterinaria
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground">Gestión de Citas</h3>
                <p className="mt-1 text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full inline-block border border-primary/20">Agenda ilimitada</p>
                <p className="mt-1 text-sm text-muted-foreground">Programa, modifica y da seguimiento a todas tus citas en un solo lugar.</p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground">Historiales Médicos</h3>
                <p className="mt-1 text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full inline-block border border-primary/20">Completo y detallado</p>
                <p className="mt-1 text-sm text-muted-foreground">Registro completo de consultas, tratamientos y vacunas de cada mascota.</p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground">Control de Inventario</h3>
                <p className="mt-1 text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full inline-block border border-primary/20">Stock y ventas</p>
                <p className="mt-1 text-sm text-muted-foreground">Gestiona medicamentos, productos y ventas con control de stock.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 