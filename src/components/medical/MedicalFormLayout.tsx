'use client';

import { Pet, Customer } from '@prisma/client';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, FileText, Activity } from 'lucide-react';
import { parseWeight } from '../../utils/format';

type PetWithCustomer = Pet & { customer: Customer };

interface MedicalFormLayoutProps {
  petInfo: PetWithCustomer;
  formTitle: string;
  formType: 'consultation' | 'treatment' | 'vaccination' | 'vitals';
  children: React.ReactNode;
  isLoading?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

export function MedicalFormLayout({ 
  petInfo, 
  formTitle, 
  formType, 
  children,
  isLoading = false,
  onSave,
  onCancel
}: MedicalFormLayoutProps) {
  const getFormIcon = () => {
    switch (formType) {
      case 'consultation': return <FileText className="h-5 w-5" />;
      case 'treatment': return <Activity className="h-5 w-5" />;
      case 'vaccination': return '💉';
      case 'vitals': return '🩺';
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getFormColor = () => {
    switch (formType) {
      case 'consultation': return 'from-blue-500 to-blue-600';
      case 'treatment': return 'from-green-500 to-green-600';
      case 'vaccination': return 'from-purple-500 to-purple-600';
      case 'vitals': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getFormColor()} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            {/* Breadcrumb - Responsive and mobile-optimized */}
            <nav className="flex items-center space-x-2 text-white mb-3 md:mb-4 text-xs md:text-sm overflow-x-auto scrollbar-hide">
              <Link
                href="/dashboard"
                className="hover:text-white/80 transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
              <span className="text-white/60">/</span>
              <Link
                href="/dashboard/pets"
                className="hover:text-white/80 transition-colors whitespace-nowrap"
              >
                Mascotas
              </Link>
              <span className="text-white/60">/</span>
              <Link
                href={`/dashboard/pets/${petInfo.id}`}
                className="hover:text-white/80 transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-[120px] md:max-w-none"
              >
                {petInfo.name}
              </Link>
              <span className="text-white/60 hidden md:inline">/</span>
              <span className="text-white/80 hidden md:inline whitespace-nowrap">{formTitle}</span>
            </nav>

            {/* Form Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                <Link
                  href={`/dashboard/pets/${petInfo.id}`}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Link>

                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  {typeof getFormIcon() === 'string' ? (
                    <span className="text-xl sm:text-2xl flex-shrink-0">{getFormIcon()}</span>
                  ) : (
                    <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 flex-shrink-0">
                      {getFormIcon()}
                    </div>
                  )}
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                    {formTitle}
                  </h1>
                </div>
              </div>

              {/* Action Buttons - Hidden on mobile (using mobile save bar below instead) */}
              <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-lg bg-white text-gray-900 hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900"></div>
                  )}
                  <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Info Bar - Mobile optimized */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-2 md:py-3 lg:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6 flex-1 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                    {petInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {petInfo.name}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {petInfo.species} • {petInfo.breed} • {petInfo.gender}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-3 lg:space-x-6 text-xs lg:text-sm">
                  <div className="flex items-center space-x-1 lg:space-x-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <Calendar className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span>
                      {(() => {
                        const birthDate = petInfo.dateOfBirth instanceof Date
                          ? petInfo.dateOfBirth
                          : new Date(petInfo.dateOfBirth);
                        const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
                        return `${age} años`;
                      })()}
                    </span>
                  </div>

                  {parseWeight(petInfo.weight) !== null && (
                    <div className="flex items-center space-x-1 lg:space-x-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      <Activity className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      <span>{parseWeight(petInfo.weight)!.toFixed(1)} {petInfo.weightUnit || 'kg'}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 lg:space-x-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <Users className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="truncate max-w-[120px] lg:max-w-[150px]">{petInfo.customer.name}</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Paso 1 de 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Save Bar - Fixed at bottom on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r ${getFormColor()} text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            )}
            <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Add padding at bottom for mobile save bar */}
      <div className="lg:hidden h-20"></div>
    </div>
  );
} 