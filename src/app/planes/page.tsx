"use client";

import React from 'react';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { PlanType } from '@/components/pricing/types';

export default function PlanesPage() {
  const handleSelectPlan = (planType: PlanType, billingCycle: 'monthly' | 'annual') => {
    // Aquí puedes manejar la selección del plan, por ejemplo:
    console.log('Plan seleccionado:', planType, 'Ciclo de facturación:', billingCycle);
    // Redirigir al proceso de pago o mostrar un modal, etc.
  };

  return (
    <main>
      <PricingPlans onSelectPlan={handleSelectPlan} />
    </main>
  );
}