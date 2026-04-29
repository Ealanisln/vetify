'use client';

import { useState } from 'react';
import { PartnersList } from './PartnersList';
import { PartnerForm } from './PartnerForm';
import { PartnerDetail } from './PartnerDetail';
import { ConversionsList } from './ConversionsList';
import {
  PlusIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ReferralStats {
  totalPartners: number;
  activePartners: number;
  totalCodes: number;
  totalSignups: number;
  totalConverted: number;
  conversionRate: string;
  pendingCommissions: number;
  totalPaidCommissions: number;
}

interface ReferralsManagerProps {
  stats: ReferralStats;
}

type View = 'partners' | 'conversions' | 'form' | 'detail';

export function ReferralsManager({ stats: initialStats }: ReferralsManagerProps) {
  const [view, setView] = useState<View>('partners');
  const [stats, setStats] = useState(initialStats);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/admin/referrals?includeStats=true');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const handleViewPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setView('detail');
  };

  const handleEditPartner = (partnerId: string | null) => {
    setEditingPartnerId(partnerId);
    setView('form');
  };

  const handleFormSuccess = () => {
    setView('partners');
    setEditingPartnerId(null);
    refreshStats();
  };

  const statCards = [
    {
      label: 'Partners Activos',
      value: stats.activePartners,
      total: stats.totalPartners,
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Conversiones',
      value: stats.totalConverted,
      subtitle: `${stats.conversionRate}% tasa`,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Comisiones Pendientes',
      value: `$${stats.pendingCommissions.toLocaleString('es-MX')}`,
      icon: ClockIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Total Pagado',
      value: `$${stats.totalPaidCommissions.toLocaleString('es-MX')}`,
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
                )}
                {card.total !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">de {card.total} total</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('partners')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'partners' || view === 'form' || view === 'detail'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Partners
          </button>
          <button
            onClick={() => setView('conversions')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'conversions'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Conversiones
          </button>
        </div>

        {(view === 'partners') && (
          <button
            onClick={() => handleEditPartner(null)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo Partner
          </button>
        )}
        {(view === 'detail' || view === 'form') && (
          <button
            onClick={() => { setView('partners'); setSelectedPartnerId(null); setEditingPartnerId(null); }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Volver a Partners
          </button>
        )}
      </div>

      {/* Content */}
      {view === 'partners' && (
        <PartnersList
          onViewPartner={handleViewPartner}
          onEditPartner={handleEditPartner}
        />
      )}
      {view === 'conversions' && <ConversionsList />}
      {view === 'form' && (
        <PartnerForm
          partnerId={editingPartnerId}
          onSuccess={handleFormSuccess}
          onCancel={() => { setView('partners'); setEditingPartnerId(null); }}
        />
      )}
      {view === 'detail' && selectedPartnerId && (
        <PartnerDetail
          partnerId={selectedPartnerId}
          onEdit={() => handleEditPartner(selectedPartnerId)}
        />
      )}
    </div>
  );
}
