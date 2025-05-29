import { getAuthenticatedUserWithOptionalTenant } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

// This page requires authentication, so it should not be prerendered
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { user, tenant } = await getAuthenticatedUserWithOptionalTenant();
  
  // If user already has a tenant, redirect to dashboard
  if (tenant) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido a Vetify! 🐾
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configuremos tu clínica veterinaria
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <OnboardingForm user={user} />
        </div>
      </div>
    </div>
  );
} 