'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Image from 'next/image';
import Link from 'next/link';
import { POSITION_LABELS_ES, type StaffPositionType } from '@/lib/staff-positions';

interface InvitationData {
  id: string;
  email: string;
  roleKey: string;
  expiresAt: string;
  tenant: {
    name: string;
    logo: string | null;
  };
  staff: {
    name: string;
    position: string;
  } | null;
}

type PageState = 'loading' | 'valid' | 'invalid' | 'accepting' | 'success' | 'error' | 'already_accepted';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState('invalid');
      setError('No se proporcionó un token de invitación');
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/invitations/validate?token=${token}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          // Special handling for already-accepted invitations
          // This happens when autoAcceptPendingInvitation accepted it during registration
          if (data.error === 'Esta invitación ya fue aceptada') {
            setState('already_accepted');
            setError(data.error);
            return;
          }
          setState('invalid');
          setError(data.error || 'Invitación inválida');
          return;
        }

        setInvitation(data.invitation);
        setState('valid');
      } catch (err) {
        console.error('Error validating invitation:', err);
        setState('error');
        setError('Error al validar la invitación');
      }
    };

    validateToken();
  }, [token]);

  // Handle accepting invitation
  const handleAcceptInvitation = useCallback(async () => {
    if (!token) return;

    setState('accepting');

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setState('error');
        setError(data.error || 'Error al aceptar la invitación');
        return;
      }

      setState('success');

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setState('error');
      setError('Error al aceptar la invitación');
    }
  }, [token, router]);

  // Check authentication status and handle already-accepted invitations
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        // Check if user is authenticated based on response
        const authenticated = res.ok && data.authenticated === true;
        setIsAuthenticated(authenticated);

        // If authenticated and invitation is valid, try to accept automatically
        if (authenticated && state === 'valid' && invitation) {
          handleAcceptInvitation();
          return;
        }

        // If authenticated and invitation was already accepted (auto-accepted during registration),
        // redirect to dashboard directly - this is the successful flow!
        if (authenticated && state === 'already_accepted') {
          setState('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }

        // If not authenticated but invitation was already accepted,
        // the session might not be ready yet after registration redirect.
        // Retry a few times with increasing delays.
        if (!authenticated && state === 'already_accepted' && retryCount < 5) {
          setTimeout(() => checkAuth(retryCount + 1), 800 * (retryCount + 1));
          return;
        }

        // After all retries, if still not authenticated, show error
        if (!authenticated && state === 'already_accepted' && retryCount >= 5) {
          setState('invalid');
          // Keep the same error message
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setIsAuthenticated(false);
      }
    };

    // Run auth check when:
    // 1. Invitation is valid (to auto-accept if authenticated)
    // 2. Invitation was already accepted (to redirect if authenticated - handles race condition)
    if (state === 'valid' || state === 'already_accepted') {
      checkAuth();
    }
  }, [state, invitation, handleAcceptInvitation, error, router]);

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75a99c] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Already accepted state - waiting for auth to be ready after registration
  // This handles the race condition where autoAcceptPendingInvitation accepted the invite
  if (state === 'already_accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75a99c] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando tu cuenta...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invitación no válida
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-[#75a99c] text-white rounded-md hover:bg-[#5b9788] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-[#75a99c] text-white rounded-md hover:bg-[#5b9788] transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ¡Bienvenido al equipo!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tu cuenta ha sido vinculada exitosamente.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Accepting state
  if (state === 'accepting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75a99c] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Aceptando invitación...</p>
        </div>
      </div>
    );
  }

  // Valid invitation state - show welcome screen
  const positionLabel = invitation?.staff?.position
    ? POSITION_LABELS_ES[invitation.staff.position as StaffPositionType] || invitation.staff.position
    : 'Personal';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#75a99c] px-6 py-8 text-center">
          {invitation?.tenant.logo ? (
            <Image
              src={invitation.tenant.logo}
              alt={invitation.tenant.name}
              width={80}
              height={80}
              className="mx-auto rounded-full bg-white p-2"
            />
          ) : (
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl font-bold text-[#75a99c]">
                {invitation?.tenant.name[0] || 'V'}
              </span>
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold text-white">
            ¡Te han invitado!
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">
                {invitation?.tenant.name}
              </strong>{' '}
              te ha invitado a unirte como:
            </p>
            <p className="mt-2 text-xl font-semibold text-[#75a99c]">
              {positionLabel}
            </p>
          </div>

          {invitation?.staff && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Nombre registrado:</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {invitation.staff.name}
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Email requerido:</strong> {invitation?.email}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Deberás crear una cuenta o iniciar sesión con este email
            </p>
          </div>

          {/* Action buttons */}
          {isAuthenticated === false ? (
            <div className="space-y-3">
              <RegisterLink
                postLoginRedirectURL={`/invite?token=${token}`}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#75a99c] text-white rounded-md hover:bg-[#5b9788] transition-colors font-medium"
              >
                Crear cuenta y aceptar
              </RegisterLink>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <LoginLink
                  postLoginRedirectURL={`/invite?token=${token}`}
                  className="text-[#75a99c] hover:text-[#5b9788] font-medium"
                >
                  Iniciar sesión
                </LoginLink>
              </p>
            </div>
          ) : isAuthenticated === true ? (
            <button
              onClick={handleAcceptInvitation}
              className="w-full flex items-center justify-center px-4 py-3 bg-[#75a99c] text-white rounded-md hover:bg-[#5b9788] transition-colors font-medium"
            >
              Aceptar invitación
            </button>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#75a99c]"></div>
            </div>
          )}

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
            Esta invitación expira el{' '}
            {invitation?.expiresAt
              ? new Date(invitation.expiresAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
