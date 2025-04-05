"use client";

import { useState } from "react";
import PocketBase, { ClientResponseError } from "pocketbase";

export default function WaitingList() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
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

    setIsSubmitting(true);
    setMessage(null);

    try {
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
      
      // Create a new record in the "waiting_list" collection
      const data = {
        email: email.toLowerCase().trim()
      };

      await pb.collection("waiting_list").create(data);

      setMessage({ type: "success", text: "¡Gracias por unirte a nuestra lista de espera! Pronto tendrás noticias de nosotros." });
      setEmail("");
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
    <div className="w-full max-w-xl mx-auto p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transform transition-all duration-500">
      <h2 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Únete a nuestra lista de espera
      </h2>
      
      <div className="text-center mb-10 space-y-4">
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Sé de los primeros en acceder a la plataforma que revolucionará la gestión veterinaria
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            ✨ Gestión simplificada
          </span>
          <span className="flex items-center">
            📊 Reportes inteligentes
          </span>
          <span className="flex items-center">
            🔔 Acceso prioritario
          </span>
        </div>
      </div>
      
      {message && (
        <div
          className={`p-6 rounded-xl text-lg mb-8 ${
            message.type === "success"
              ? "bg-green-100/80 text-green-800 dark:bg-green-900/80 dark:text-green-200"
              : "bg-red-100/80 text-red-800 dark:bg-red-900/80 dark:text-red-200"
          } backdrop-blur-sm transition-all duration-300 transform`}
        >
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-6 py-4 text-lg border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brown/50 dark:focus:ring-brownD/50 focus:border-transparent dark:bg-gray-700/50 dark:text-white transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="tu@email.com"
            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            title="Por favor ingresa un correo electrónico válido"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brown hover:bg-brown/90 dark:bg-brownD dark:hover:bg-brownD/90 text-white text-lg font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </span>
          ) : (
            "Unirme a la lista"
          )}
        </button>
      </form>
    </div>
  );
} 