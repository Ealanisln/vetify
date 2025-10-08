'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

interface Payment {
  id: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: string;
  description?: string;
}

interface PaymentHistoryProps {
  limit?: number;
}

export function PaymentHistory({ limit }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const url = limit 
          ? `/api/admin/billing/payments?limit=${limit}`
          : '/api/admin/billing/payments';
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [limit]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Exitoso';
      case 'failed':
        return 'Fallido';
      case 'pending':
        return 'Pendiente';
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
          {limit ? 'Pagos Recientes' : 'Historial de Pagos'}
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {payments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No hay pagos registrados
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(payment.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.tenantName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.description || 'Pago de suscripción'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', { 
                      style: 'currency', 
                      currency: payment.currency || 'MXN'
                    }).format(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusText(payment.status)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {limit && payments.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center">
          <Link 
            href="/admin/billing/payments"
            className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
          >
            Ver todos los pagos →
          </Link>
        </div>
      )}
    </div>
  );
} 