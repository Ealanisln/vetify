'use client';

interface OnboardingProgressProps {
  currentStep: 'plan' | 'clinic' | 'confirmation';
  showImplementationStatus?: boolean;
}

const steps = [
  { key: 'plan', label: 'Plan', description: 'Selecciona tu plan' },
  { key: 'clinic', label: 'Clínica', description: 'Información básica' },
  { key: 'confirmation', label: 'Confirmar', description: 'Revisar y crear' },
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          // const isUpcoming = index > currentStepIndex; // Unused for now

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-[#75a99c] text-white'
                      : isCurrent
                      ? 'bg-[#75a99c] text-white ring-2 md:ring-4 ring-[#75a99c]/20'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-1 md:mt-2 text-center px-1">
                  <div
                    className={`text-xs font-medium ${
                      isCompleted || isCurrent
                        ? 'text-[#75a99c]'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-xs hidden md:block ${
                      isCompleted || isCurrent
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 transition-all ${
                    isCompleted
                      ? 'bg-[#75a99c]'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 