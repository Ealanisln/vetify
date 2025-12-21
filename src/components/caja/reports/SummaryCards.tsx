'use client';

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  CalculatorIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SummaryCardsProps {
  data: {
    totalIncome: number;
    totalExpenses: number;
    netTotal: number;
    transactionCount: number;
    avgTransactionValue: number;
  };
  discrepancies: {
    totalDifference: number;
    shiftsWithDifference: number;
    worstDiscrepancy: number;
  };
  loading?: boolean;
}

export function SummaryCards({ data, discrepancies, loading }: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Ingresos',
      value: formatCurrency(data.totalIncome),
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Total Egresos',
      value: formatCurrency(data.totalExpenses),
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Balance Neto',
      value: formatCurrency(data.netTotal),
      icon: BanknotesIcon,
      color: data.netTotal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400',
      bgColor: data.netTotal >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Transacciones',
      value: data.transactionCount.toString(),
      icon: ReceiptRefundIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Promedio/Transacción',
      value: formatCurrency(data.avgTransactionValue),
      icon: CalculatorIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      title: 'Diferencias Totales',
      value: formatCurrency(discrepancies.totalDifference),
      subtitle: `${discrepancies.shiftsWithDifference} turno(s) con diferencia`,
      icon: ExclamationTriangleIcon,
      color: discrepancies.totalDifference === 0
        ? 'text-green-600 dark:text-green-400'
        : discrepancies.totalDifference > 0
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-red-600 dark:text-red-400',
      bgColor: discrepancies.totalDifference === 0
        ? 'bg-green-50 dark:bg-green-900/20'
        : 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
          </div>
          <p className={`text-lg font-semibold ${card.color}`}>{card.value}</p>
          {card.subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
