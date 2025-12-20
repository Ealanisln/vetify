'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  ClockIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SaleDetailModal } from '@/components/sales/SaleDetailModal';

interface TransactionHistoryProps {
  tenantId: string;
}

interface Transaction {
  id: string;
  type: 'SALE' | 'REFUND' | 'OPENING' | 'CLOSING' | 'SALE_CASH' | 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'MIXED';
  description: string;
  customerName?: string;
  createdAt: Date;
  status: string;
  saleId?: string | null;
}

// Traducciones de estatus
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completado',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelado',
  PAID: 'Pagado',
  PARTIALLY_PAID: 'Pago Parcial',
  REFUNDED: 'Reembolsado',
  PROCESSING: 'Procesando'
};

export function TransactionHistory({ tenantId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const isSaleTransaction = (type: string) => {
    return type === 'SALE_CASH' || type === 'SALE';
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/caja/transactions?tenantId=${tenantId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const getTransactionIcon = (type: string, paymentMethod: string) => {
    if (type === 'REFUND') return ReceiptRefundIcon;
    if (paymentMethod === 'CARD') return CreditCardIcon;
    return CurrencyDollarIcon;
  };

  const getTransactionColor = (type: string, paymentMethod: string) => {
    if (type === 'REFUND') return 'text-red-600';
    if (paymentMethod === 'CARD') return 'text-purple-600';
    return 'text-green-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'default',
      'PENDING': 'secondary',
      'CANCELLED': 'destructive'
    } as const;
    
    return variants[status as keyof typeof variants] || 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Transacciones Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay transacciones recientes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type, transaction.paymentMethod);
              const iconColor = getTransactionColor(transaction.type, transaction.paymentMethod);
              const isClickable = isSaleTransaction(transaction.type) && transaction.saleId;

              return (
                <div
                  key={transaction.id}
                  onClick={() => {
                    if (isClickable && transaction.saleId) {
                      setSelectedSaleId(transaction.saleId);
                    }
                  }}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    isClickable
                      ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/20 border border-transparent'
                      : 'hover:bg-accent'
                  }`}
                  title={isClickable ? 'Click para ver detalles de la venta' : undefined}
                >
                  <div className={`p-2 rounded-full bg-muted`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {transaction.description}
                      </p>
                      <Badge variant={getStatusBadge(transaction.status)} className="text-xs">
                        {STATUS_LABELS[transaction.status] || transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>
                        {format(new Date(transaction.createdAt), 'HH:mm', { locale: es })}
                      </span>
                      {transaction.customerName && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{transaction.customerName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'REFUND' || transaction.type === 'REFUND_CASH'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {transaction.type === 'REFUND' || transaction.type === 'REFUND_CASH' ? '-' : '+'}
                        ${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {transaction.paymentMethod === 'MIXED' ? 'MIXTO' :
                         transaction.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
                      </p>
                    </div>
                    {isClickable && (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de detalle de venta */}
      <SaleDetailModal
        saleId={selectedSaleId}
        open={!!selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </Card>
  );
} 