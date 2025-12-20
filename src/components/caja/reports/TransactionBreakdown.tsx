'use client';

const TRANSACTION_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  SALE_CASH: {
    label: 'Ventas (Efectivo)',
    color: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  DEPOSIT: {
    label: 'Depósitos',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  ADJUSTMENT_IN: {
    label: 'Ajustes (+)',
    color: 'bg-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30'
  },
  REFUND_CASH: {
    label: 'Devoluciones',
    color: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  WITHDRAWAL: {
    label: 'Retiros',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  ADJUSTMENT_OUT: {
    label: 'Ajustes (-)',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  }
};

interface TransactionBreakdownProps {
  data: Record<string, { count: number; total: number }>;
  loading?: boolean;
}

export function TransactionBreakdown({ data, loading }: TransactionBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Convert to array and sort by total (descending)
  const entries = Object.entries(data)
    .filter(([, value]) => value.count > 0)
    .map(([type, value]) => ({
      type,
      ...value,
      config: TRANSACTION_LABELS[type] || {
        label: type,
        color: 'bg-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30'
      }
    }))
    .sort((a, b) => b.total - a.total);

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Desglose por Tipo</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay transacciones en este período
        </p>
      </div>
    );
  }

  const maxTotal = Math.max(...entries.map(e => e.total));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Desglose por Tipo</h3>
      <div className="space-y-4">
        {entries.map((entry) => {
          const percentage = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
          return (
            <div key={entry.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{entry.config.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{entry.count} txn</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(entry.total)}</span>
                </div>
              </div>
              <div className={`h-4 rounded-full ${entry.config.bgColor} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${entry.config.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
