'use client';

import { useState, useEffect } from 'react';

interface Conversion {
  id: string;
  status: string;
  signedUpAt: string;
  convertedAt: string | null;
  planKey: string | null;
  subscriptionAmount: string | null;
  commissionPercent: string | null;
  commissionAmount: string | null;
  payoutStatus: string;
  partner: { id: string; name: string; email: string };
  code: { code: string };
  tenant: { id: string; name: string; slug: string; planType: string };
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  SIGNUP: { label: 'Registro', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  CONVERTED: { label: 'Convertido', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CHURNED: { label: 'Cancelado', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const payoutLabels: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PAID: { label: 'Pagado', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  VOID: { label: 'Anulado', classes: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

export function ConversionsList() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [payoutFilter, setPayoutFilter] = useState<string>('');

  useEffect(() => {
    fetchConversions();
  }, [statusFilter, payoutFilter]);

  const fetchConversions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (payoutFilter) params.set('payoutStatus', payoutFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/referrals/conversions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversions(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching conversions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayoutUpdate = async (conversionId: string, status: 'APPROVED' | 'PAID' | 'VOID') => {
    try {
      const res = await fetch(`/api/admin/referrals/conversions/${conversionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchConversions();
      }
    } catch (error) {
      console.error('Error updating payout:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="SIGNUP">Registro</option>
          <option value="CONVERTED">Convertido</option>
          <option value="CHURNED">Cancelado</option>
        </select>
        <select
          value={payoutFilter}
          onChange={(e) => setPayoutFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="">Todos los pagos</option>
          <option value="PENDING">Pendiente</option>
          <option value="APPROVED">Aprobado</option>
          <option value="PAID">Pagado</option>
          <option value="VOID">Anulado</option>
        </select>
        <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          {total} resultado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : conversions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No hay conversiones</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clinica</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Codigo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comision</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversions.map((conv) => {
                const status = statusLabels[conv.status] || { label: conv.status, classes: '' };
                const payout = payoutLabels[conv.payoutStatus] || { label: conv.payoutStatus, classes: '' };
                return (
                  <tr key={conv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">{conv.tenant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{conv.tenant.planType}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{conv.partner.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{conv.code.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(conv.signedUpAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.classes}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {conv.commissionAmount ? `$${Number(conv.commissionAmount).toLocaleString('es-MX')}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${payout.classes}`}>
                        {payout.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {conv.status === 'CONVERTED' && conv.payoutStatus === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePayoutUpdate(conv.id, 'APPROVED')}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            Aprobar
                          </button>
                        </div>
                      )}
                      {conv.status === 'CONVERTED' && conv.payoutStatus === 'APPROVED' && (
                        <button
                          onClick={() => handlePayoutUpdate(conv.id, 'PAID')}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50"
                        >
                          Marcar Pagado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
