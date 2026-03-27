'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  commissionPercent: string;
  isActive: boolean;
  createdAt: string;
  referralCodes: { id: string; code: string; isActive: boolean; clickCount: number }[];
  _count: { conversions: number };
}

interface PartnersListProps {
  onViewPartner: (id: string) => void;
  onEditPartner: (id: string) => void;
}

export function PartnersList({ onViewPartner, onEditPartner }: PartnersListProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/referrals');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No hay partners registrados</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Crea tu primer partner para empezar a trackear referidos
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partner</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comision</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Codigos</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conversiones</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {partners.map((partner) => (
            <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{partner.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{partner.email}</p>
                  {partner.company && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{partner.company}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {partner.commissionPercent}%
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {partner.referralCodes.filter(c => c.isActive).map((code) => (
                    <span
                      key={code.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {code.code}
                    </span>
                  ))}
                  {partner.referralCodes.filter(c => c.isActive).length === 0 && (
                    <span className="text-xs text-gray-400">Sin codigos</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-900 dark:text-white">{partner._count.conversions}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    partner.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {partner.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewPartner(partner.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Ver detalle"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEditPartner(partner.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
