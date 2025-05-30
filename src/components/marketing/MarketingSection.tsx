import React from 'react';
import FeatureShowcase from './FeatureShowcase';
import BenefitsSection from './BenefitsSection';
import HowItWorksSection from './HowItWorksSection';
import WhatsAppDemoSection from './WhatsAppDemoSection';

interface MarketingSectionProps {
  showFeatures?: boolean;
  showBenefits?: boolean;
  showHowItWorks?: boolean;
  showWhatsAppDemo?: boolean;
}

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  showFeatures = true,
  showBenefits = true,
  showHowItWorks = true,
  showWhatsAppDemo = true,
}) => {
  return (
    <>
      {showWhatsAppDemo && <WhatsAppDemoSection />}
      {showFeatures && <FeatureShowcase />}
      {showBenefits && <BenefitsSection />}
      {showHowItWorks && <HowItWorksSection />}
    </>
  );
};

export default MarketingSection; 