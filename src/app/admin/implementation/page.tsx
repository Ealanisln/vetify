import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingImplementationDashboard } from '../../../components/admin/OnboardingImplementationDashboard';

export default async function ImplementationPage() {
  const { isAuthenticated } = getKindeServerSession();
  
  if (!isAuthenticated()) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <OnboardingImplementationDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Onboarding Implementation Tracker - Vetify Admin',
  description: 'Track progress of the multi-step onboarding with trial management implementation',
};