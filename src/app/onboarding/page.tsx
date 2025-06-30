"use client";

import { getAuthenticatedUserWithOptionalTenant } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { useThemeAware } from '@/hooks/useThemeAware';
import { useEffect, useState } from 'react';
import { UserWithTenant } from '@/types';

// This page requires authentication, so it should not be prerendered
export const dynamic = 'force-dynamic';

// Theme Toggle Component
function ThemeToggle() {
  const { mounted, theme, setTheme } = useThemeAware();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200 w-10 h-10 flex items-center justify-center bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] hover:scale-105 active:scale-95 shadow-md"
      aria-label="Cambiar tema"
    >
      <span className="text-sm">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}

// Client Component for the main content
function OnboardingPageClient() {
  const [user, setUser] = useState<UserWithTenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user: userData, tenant } = await getAuthenticatedUserWithOptionalTenant();
        
        // If user already has a tenant, redirect to dashboard
        if (tenant) {
          redirect('/dashboard');
          return;
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        redirect('/sign-in');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75a99c]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">
            ¡Bienvenido a Vetify! 🐾
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Configuremos tu clínica veterinaria
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <OnboardingForm user={user} />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return <OnboardingPageClient />;
} 