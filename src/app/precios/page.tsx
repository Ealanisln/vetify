"use client";

import React, { useState } from 'react';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { PlanType } from '@/components/pricing/types';
import WaitingList from '@/components/WaitingList';
import { X } from 'lucide-react';

export default function PlanesPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{type: PlanType, cycle: 'monthly' | 'annual'} | null>(null);

  const handleSelectPlan = (planType: PlanType, billingCycle: 'monthly' | 'annual') => {
    // Guardar el plan seleccionado y mostrar el formulario de lista de espera
    setSelectedPlan({type: planType, cycle: billingCycle});
    setShowWaitlist(true);
  };

  const closeModal = () => {
    setShowWaitlist(false);
  };

  return (
    <main className="relative">
      <PricingPlans onSelectPlan={handleSelectPlan} />
      
      {/* Modal de lista de espera */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 dark:text-white dark:hover:text-gray-300 transition-colors z-30"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <WaitingList 
              selectedPlan={selectedPlan ? {
                planType: selectedPlan.type,
                billingCycle: selectedPlan.cycle
              } : undefined}
              onSuccess={closeModal}
            />
          </div>
        </div>
      )}
    </main>
  );
}