"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { requestSetupTokenAction } from './actions';

export default function SetupPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'form' | 'verifying' | 'success' | 'error'>(token ? 'verifying' : 'form');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (token) {
      const complete = async () => {
        try {
          const res = await fetch('/api/setup/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const json = await res.json();
          if (res.ok) {
            setState('success');
          } else {
            setMessage(json.error || 'Error');
            setState('error');
          }
        } catch (err) {
          console.error(err);
          setMessage('Server error');
          setState('error');
        }
      };
      complete();
    }
  }, [token]);

  if (state === 'verifying') {
    return <p>Verificando token…</p>;
  }

  if (state === 'success') {
    return <p className="text-green-600 text-xl">¡Configuración completada! Ahora puedes iniciar sesión.</p>;
  }

  if (state === 'error') {
    return <div className="text-red-600"><p>Error: {message}</p></div>;
  }

  // form state
  return (
    <form
      action={requestSetupTokenAction}
      className="bg-white p-8 rounded shadow w-96 space-y-4"
    >
      <h1 className="text-2xl font-semibold text-center">Configuración inicial de Vetify</h1>
      <p className="text-sm text-gray-600 text-center">Ingresa tu email corporativo para recibir el enlace de verificación.</p>
      <input
        type="email"
        name="email"
        placeholder="correo@vetify.pro"
        className="border w-full p-2 rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
      >
        Enviar enlace
      </button>
    </form>
  );
} 