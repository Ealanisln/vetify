import { getAuthenticatedUserWithOptionalTenant } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { getActivePromotionFromDB } from '../../lib/pricing-config';
import { OnboardingPageClient } from './OnboardingPageClient';

// This page requires authentication, so it should not be prerendered
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  try {
    const { user, tenant } = await getAuthenticatedUserWithOptionalTenant();
    
    // If user already has a tenant, redirect to dashboard
    if (tenant) {
      console.log(`User ${user.id} already has tenant ${tenant.id}, redirecting to dashboard`);
      redirect('/dashboard');
    }

    // Check for active promotion to show in onboarding UI
    const promotion = await getActivePromotionFromDB();
    const promoInfo = promotion?.promotionType === 'FREE_TRIAL' && promotion.trialDays
      ? { trialDays: promotion.trialDays, badgeText: promotion.badgeText, description: promotion.description }
      : null;

    return <OnboardingPageClient user={user} promoInfo={promoInfo} />;
  } catch (error) {
    console.error('Error loading user:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Check if this is a redirect error (which is expected)
      if (error.message.includes('NEXT_REDIRECT')) {
        throw error; // Re-throw redirect errors
      }
      
      // Log unexpected errors
      console.error('Unexpected error in onboarding:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // For authentication errors, redirect to sign-in
    redirect('/sign-in');
  }
} 