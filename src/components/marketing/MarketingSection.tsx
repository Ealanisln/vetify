import React from 'react';
import FeatureShowcase from './FeatureShowcase';
import BenefitsSection from './BenefitsSection';
import HowItWorksSection from './HowItWorksSection';

interface MarketingSectionProps {
  showFeatures?: boolean;
  showBenefits?: boolean;
  showHowItWorks?: boolean;
}

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  showFeatures = true,
  showBenefits = true,
  showHowItWorks = true,
}) => {
  return (
    <>
      {showFeatures && <FeatureShowcase />}
      {showBenefits && <BenefitsSection />}
      {showHowItWorks && <HowItWorksSection />}
    </>
  );
};

export default MarketingSection; 