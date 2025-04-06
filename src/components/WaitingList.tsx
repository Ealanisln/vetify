"use client";

import { useState } from "react";
import PocketBase, { ClientResponseError } from "pocketbase";
import { ArrowRight, Check } from "lucide-react";
import { PlanType } from "@/components/pricing/types";
import Link from "next/link";

interface WaitingListProps {
  selectedPlan?: {
    planType: PlanType;
    billingCycle: 'monthly' | 'annual';
  };
  onSuccess?: () => void;
}

export default function WaitingList({ selectedPlan, onSuccess }: WaitingListProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const getPlanName = () => {
    if (!selectedPlan) return '';
    
    switch (selectedPlan.planType) {
      case PlanType.BASIC: return 'Básico';
      case PlanType.STANDARD: return 'Estándar';
      default: return 'Premium';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage({
        type: "error",
        text: "Por favor, ingresa un correo electrónico válido."
      });
      return;
    }

    if (!privacyConsent) {
      setMessage({
        type: "error",
        text: "Debes aceptar nuestra política de privacidad para continuar."
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
      
      // Create a new record in the "waiting_list" collection
      const data = {
        email: email.toLowerCase().trim(),
        interest_plan: selectedPlan ? selectedPlan.planType : null,
        billing_cycle: selectedPlan ? selectedPlan.billingCycle : null,
        privacy_consent: privacyConsent
      };

      await pb.collection("waiting_list").create(data);

      setMessage({ type: "success", text: "¡Gracias por unirte a nuestra lista de espera! Pronto tendrás noticias de nosotros." });
      setEmail("");
      setPrivacyConsent(false);
      
      // Llamar al callback de éxito después de un tiempo para que el usuario pueda ver el mensaje
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error details:', error);
      
      let errorMessage = "Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.";
      
      if (error instanceof ClientResponseError) {
        if (error.status === 0 || error.status === undefined) {
          errorMessage = "No se pudo conectar con el servidor. Por favor, intenta de nuevo más tarde.";
        } else if (error.status === 403) {
          errorMessage = "No tienes permiso para realizar esta acción. Por favor, contacta al administrador.";
        } else if (error.status === 400) {
          if (error.response?.data?.email?.message) {
            errorMessage = "El correo electrónico no es válido.";
          } else if (error.response?.message) {
            errorMessage = error.response.message;
          }
        }
      }
      
      setMessage({ 
        type: "error", 
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Encabezado con gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-500 py-8 px-6 sm:px-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10 z-10"></div>
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500 rounded-full opacity-20"></div>
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-600 rounded-full opacity-20"></div>
        
        <div className="relative z-20">
          <div className="inline-block px-4 py-1 mb-3 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            ¡Próximamente!
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Únete a nuestra lista de espera
          </h2>
          <p className="text-lg text-white/90">
            {selectedPlan 
              ? `Te has interesado en nuestro Plan ${getPlanName()} con facturación ${selectedPlan.billingCycle === 'monthly' ? 'mensual' : 'anual'}`
              : 'Sé de los primeros en acceder a la plataforma que revolucionará la gestión veterinaria'
            }
          </p>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap justify-center gap-5 text-base text-gray-500 dark:text-gray-400 mb-8">
          <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700/40 rounded-full">
            <Check className="w-4 h-4 text-teal-500 dark:text-teal-400 mr-2" />
            <span>Gestión simplificada</span>
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700/40 rounded-full">
            <Check className="w-4 h-4 text-teal-500 dark:text-teal-400 mr-2" />
            <span>Reportes inteligentes</span>
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700/40 rounded-full">
            <Check className="w-4 h-4 text-teal-500 dark:text-teal-400 mr-2" />
            <span>Acceso prioritario</span>
          </div>
        </div>
        
        {message && (
          <div
            className={`p-5 rounded-xl mb-8 text-base ${
              message.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800/30"
                : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-800/30"
            } backdrop-blur-sm transition-all duration-300 transform`}
          >
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-base font-medium text-gray-700 dark:text-gray-300">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="tu@email.com"
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
              title="Por favor ingresa un correo electrónico válido"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy"
                name="privacy"
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="privacy" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Acepto la{" "}
                <Link href="/privacidad" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors">
                  política de privacidad
                </Link>{" "}
                y el tratamiento de mis datos.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !privacyConsent}
            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] disabled:opacity-50 disabled:hover:translate-y-0 shadow-md"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              <>
                Unirme a la lista <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Te notificaremos cuando lancemos. No compartiremos tu correo con terceros.
        </p>
      </div>
    </div>
  );
} 