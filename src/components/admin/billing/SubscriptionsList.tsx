'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface Subscription {
  id: string;
  tenantName: string;
  planName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'PAUSED';
  currentPeriodEnd: string;
  amount: number;
  currency: string;
}

interface SubscriptionsListProps {
  limit?: number;
}

export function SubscriptionsList({ limit }: SubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const url = limit 
          ? `/api/admin/billing/subscriptions?limit=${limit}`
          : '/api/admin/billing/subscriptions';
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [limit]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'PAST_DUE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'PAUSED':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'CANCELLED':
        return 'Cancelada';
      case 'PAST_DUE':
        return 'Vencida';
      case 'PAUSED':
        return 'Pausada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          {[...Array(limit || 5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {limit ? 'Suscripciones Recientes' : 'Todas las Suscripciones'}
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {subscriptions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No hay suscripciones disponibles
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <div key={subscription.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(subscription.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscription.tenantName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Plan: {subscription.planName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Renovación: {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', { 
                      style: 'currency', 
                      currency: subscription.currency || 'MXN'
                    }).format(subscription.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusText(subscription.status)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {limit && subscriptions.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center">
          <Link 
            href="/admin/billing/subscriptions"
            className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
          >
            Ver todas las suscripciones →
          </Link>
        </div>
      )}
    </div>
  );
} 