'use client';

import { useState, useEffect } from 'react';

interface PartnerFormProps {
  partnerId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PartnerData {
  name: string;
  email: string;
  phone: string;
  company: string;
  commissionPercent: number;
  notes: string;
  isActive: boolean;
}

const defaultData: PartnerData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  commissionPercent: 20,
  notes: '',
  isActive: true,
};

export function PartnerForm({ partnerId, onSuccess, onCancel }: PartnerFormProps) {
  const [data, setData] = useState<PartnerData>(defaultData);
  const [newCode, setNewCode] = useState('');
  const [codes, setCodes] = useState<{ id: string; code: string; isActive: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!partnerId;

  useEffect(() => {
    if (partnerId) {
      fetchPartner();
    }
  }, [partnerId]);

  const fetchPartner = async () => {
    try {
      const res = await fetch(`/api/admin/referrals/${partnerId}`);
      if (res.ok) {
        const result = await res.json();
        const p = result.data;
        setData({
          name: p.name,
          email: p.email,
          phone: p.phone || '',
          company: p.company || '',
          commissionPercent: Number(p.commissionPercent),
          notes: p.notes || '',
          isActive: p.isActive,
        });
        setCodes(p.referralCodes || []);
      }
    } catch (err) {
      console.error('Error fetching partner:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/referrals/${partnerId}`
        : '/api/admin/referrals';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || 'Error al guardar');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Error de conexion');
      console.error('Error saving partner:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCode = async () => {
    if (!newCode.trim() || !partnerId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals/${partnerId}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setCodes((prev) => [result.data, ...prev]);
        setNewCode('');
      } else {
        setError(result.error || 'Error al crear codigo');
      }
    } catch (err) {
      console.error('Error creating code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isEditing ? 'Editar Partner' : 'Nuevo Partner'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefono
            </label>
            <input
              type="text"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Empresa
            </label>
            <input
              type="text"
              value={data.company}
              onChange={(e) => setData({ ...data, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comision (%) *
            </label>
            <input
              type="number"
              value={data.commissionPercent}
              onChange={(e) => setData({ ...data, commissionPercent: Number(e.target.value) })}
              min={1}
              max={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          {isEditing && (
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={data.isActive}
                onChange={(e) => setData({ ...data, isActive: e.target.checked })}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Activo
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
        </div>

        {/* Referral codes section (only when editing) */}
        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Codigos de Referido
            </h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ej: DRSMITH"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleAddCode}
                disabled={!newCode.trim() || isLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                Agregar
              </button>
            </div>
            {codes.length > 0 && (
              <div className="space-y-2">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{code.code}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        code.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {code.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Partner'}
          </button>
        </div>
      </form>
    </div>
  );
}
