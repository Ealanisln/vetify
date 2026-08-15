'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Coins, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CURRENCIES, DEFAULT_CURRENCY, formatMoney, getCurrency } from '@/lib/currency';

interface CurrencySettingsData {
  currencyCode: string;
  taxRate: number;
  currencyConfirmed: boolean;
  saleCount: number;
  /** Charge currency of the Vetify subscription — read-only, set at onboarding. */
  billingCurrency?: string;
}

/** Amount used for the live preview. Big enough to show grouping separators. */
const PREVIEW_AMOUNT = 1234.5;

const CURRENCY_OPTIONS = Object.values(CURRENCIES).sort((a, b) =>
  a.name.localeCompare(b.name, 'es')
);

export function CurrencySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [initial, setInitial] = useState<CurrencySettingsData | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY);
  const [taxRatePercent, setTaxRatePercent] = useState<string>('16');
  const [pendingRelabel, setPendingRelabel] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings/currency');
        if (!res.ok) throw new Error('load failed');
        const data: CurrencySettingsData = await res.json();
        setInitial(data);
        setCurrencyCode(data.currencyCode);
        setTaxRatePercent(String(Math.round(data.taxRate * 10000) / 100));
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const meta = getCurrency(currencyCode);
  const parsedTaxPercent = Number(taxRatePercent);
  const taxRateValid = Number.isFinite(parsedTaxPercent) && parsedTaxPercent >= 0 && parsedTaxPercent <= 100;
  const isCurrencyChange = initial !== null && initial.currencyCode !== currencyCode;
  const hasEdits =
    initial !== null &&
    (isCurrencyChange || Math.abs(initial.taxRate - parsedTaxPercent / 100) > 1e-9);
  // Confirming the guessed defaults unchanged is itself a meaningful save --
  // it is exactly what the banner asks for, so the button cannot be disabled.
  const canSave = initial !== null && (hasEdits || !initial.currencyConfirmed);
  // A two-decimal currency losing its cents is worth flagging on its own.
  const losesDecimals =
    initial !== null && getCurrency(initial.currencyCode).displayDecimals > meta.displayDecimals;

  const save = async (confirmRelabel: boolean) => {
    if (!taxRateValid) {
      toast.error('La tasa de impuesto debe estar entre 0 y 100');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode,
          taxRate: parsedTaxPercent / 100,
          confirmRelabel,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.code === 'CONFIRM_RELABEL_REQUIRED') {
        setInitial((prev) => (prev ? { ...prev, saleCount: data.saleCount } : prev));
        setPendingRelabel(true);
        return;
      }

      if (!res.ok) throw new Error(data.error || 'save failed');

      setInitial({
        currencyCode: data.currencyCode,
        taxRate: data.taxRate,
        currencyConfirmed: true,
        saleCount: initial?.saleCount ?? 0,
      });
      setPendingRelabel(false);
      toast.success('Configuración regional guardada');
    } catch {
      toast.error('Error al guardar la configuración regional');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (loadError || !initial) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Error al cargar la configuración regional
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Moneda y Región
            {!initial.currencyConfirmed && (
              <Badge variant="outline" className="ml-2">
                Sin confirmar
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Define cómo se muestran los importes y qué impuesto se desglosa en tickets y reportes.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!initial.currencyConfirmed && (
            <div className="flex gap-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Estos valores son los predeterminados y nadie los ha confirmado todavía.
                Verifica que correspondan a tu país y guarda para confirmarlos.
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="currency-code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Moneda
              </label>
              <select
                id="currency-code"
                value={currencyCode}
                onChange={(e) => {
                  setCurrencyCode(e.target.value);
                  setPendingRelabel(false);
                }}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-[#75a99c] focus:border-[#75a99c]"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ejemplo:{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatMoney(PREVIEW_AMOUNT, currencyCode)}
                </span>
              </p>
            </div>

            <div>
              <label
                htmlFor="tax-rate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Impuesto incluido (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-[#75a99c] focus:border-[#75a99c]"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Los precios se capturan con el impuesto ya incluido; esto solo controla el desglose.
              </p>
              {!taxRateValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Debe ser un número entre 0 y 100.
                </p>
              )}
            </div>
          </div>

          {pendingRelabel && (
            <div className="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div className="text-sm text-red-800 dark:text-red-300 space-y-2">
                  <p>
                    Tienes <strong>{initial.saleCount}</strong>{' '}
                    {initial.saleCount === 1 ? 'venta registrada' : 'ventas registradas'}. Cambiar la
                    moneda de <strong>{initial.currencyCode}</strong> a <strong>{meta.code}</strong>{' '}
                    <strong>NO convierte los montos</strong>: una venta de 1,500 se seguirá
                    mostrando como 1,500, ahora en {meta.code}.
                  </p>
                  {losesDecimals && (
                    <p>
                      Además, {meta.code} no usa centavos: los importes con decimales se mostrarán
                      redondeados. Los datos guardados no cambian.
                    </p>
                  )}
                  <p>Los tickets ya impresos no cambian.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => save(true)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Sí, cambiar a {meta.code}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPendingRelabel(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {initial.billingCurrency && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 flex gap-3">
              <Coins className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tu suscripción de Vetify se cobra en{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {initial.billingCurrency}
                </span>
                . Esta sección solo controla la moneda de tus precios, tickets y reportes; para
                cambiar la moneda de cobro contacta a soporte.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => save(false)}
              disabled={saving || !canSave || !taxRateValid || pendingRelabel}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {initial.currencyConfirmed || hasEdits ? 'Guardar' : 'Confirmar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
