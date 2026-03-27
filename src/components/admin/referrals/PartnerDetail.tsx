'use client';

import { useState, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

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
  code: { code: string };
  tenant: { name: string; planType: string };
}

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  commissionPercent: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  referralCodes: { id: string; code: string; isActive: boolean; clickCount: number }[];
  conversions: Conversion[];
}

interface PartnerDetailProps {
  partnerId: string;
  onEdit: () => void;
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

export function PartnerDetail({ partnerId, onEdit }: PartnerDetailProps) {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPartner();
  }, [partnerId]);

  const fetchPartner = async () => {
    try {
      const res = await fetch(`/api/admin/referrals/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setPartner(data.data);
      }
    } catch (error) {
      console.error('Error fetching partner:', error);
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
        fetchPartner();
      }
    } catch (error) {
      console.error('Error updating payout:', error);
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />;
  }

  if (!partner) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Partner no encontrado
      </div>
    );
  }

  const totalCommission = partner.conversions
    .filter((c) => c.status === 'CONVERTED')
    .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

  const pendingCommission = partner.conversions
    .filter((c) => c.status === 'CONVERTED' && (c.payoutStatus === 'PENDING' || c.payoutStatus === 'APPROVED'))
    .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Partner Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{partner.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{partner.email}</p>
            {partner.company && <p className="text-sm text-gray-400 dark:text-gray-500">{partner.company}</p>}
            {partner.phone && <p className="text-sm text-gray-400 dark:text-gray-500">{partner.phone}</p>}
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Comision</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{partner.commissionPercent}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Conversiones</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {partner.conversions.filter((c) => c.status === 'CONVERTED').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Comision Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">${totalCommission.toLocaleString('es-MX')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente de Pago</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">${pendingCommission.toLocaleString('es-MX')}</p>
          </div>
        </div>

        {partner.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{partner.notes}</p>
          </div>
        )}
      </div>

      {/* Referral Codes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Codigos de Referido</h4>
        <div className="space-y-2">
          {partner.referralCodes.map((code) => (
            <div key={code.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{code.code}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{code.clickCount} clicks</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${code.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {code.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
          {partner.referralCodes.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">Sin codigos. Edita el partner para agregar uno.</p>
          )}
        </div>
      </div>

      {/* Conversions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Historial de Conversiones</h4>
        </div>
        {partner.conversions.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Sin conversiones aun
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clinica</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Codigo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comision</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {partner.conversions.map((conv) => {
                const status = statusLabels[conv.status] || { label: conv.status, classes: '' };
                const payout = payoutLabels[conv.payoutStatus] || { label: conv.payoutStatus, classes: '' };
                return (
                  <tr key={conv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{conv.tenant.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{conv.code.code}</td>
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
                          <button
                            onClick={() => handlePayoutUpdate(conv.id, 'VOID')}
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Anular
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
        )}
      </div>
    </div>
  );
}
