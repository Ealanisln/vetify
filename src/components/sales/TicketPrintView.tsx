'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SaleDetail } from './SaleDetailModal';

interface TicketPrintViewProps {
  sale: SaleDetail;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta Crédito',
  DEBIT_CARD: 'Tarjeta Débito',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro'
};

export function TicketPrintView({ sale }: TicketPrintViewProps) {
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(numAmount).replace('MX$', '$');
  };

  const formatDateShort = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  };

  return (
    <div className="ticket-print-container font-mono text-xs p-2 max-w-[80mm] mx-auto bg-white text-black">
      {/* Header */}
      <div className="text-center mb-2 pb-2 border-b border-dashed border-black">
        <h1 className="text-sm font-bold">{sale.tenant.name}</h1>
        {sale.tenant.publicAddress && <p className="text-[10px]">{sale.tenant.publicAddress}</p>}
        {sale.tenant.publicPhone && <p className="text-[10px]">Tel: {sale.tenant.publicPhone}</p>}
        {sale.tenant.publicEmail && <p className="text-[10px]">{sale.tenant.publicEmail}</p>}
      </div>

      {/* Sale Info */}
      <div className="mb-2 pb-2 border-b border-dashed border-black text-[11px]">
        <p><strong>Ticket:</strong> #{sale.saleNumber}</p>
        <p><strong>Fecha:</strong> {formatDateShort(sale.createdAt)}</p>
        <p><strong>Cliente:</strong> {sale.customer?.name || 'General'}</p>
        {sale.customer?.phone && <p><strong>Tel:</strong> {sale.customer.phone}</p>}
        {sale.pet && (
          <p><strong>Mascota:</strong> {sale.pet.name} ({sale.pet.species})</p>
        )}
      </div>

      {/* Items */}
      <div className="mb-2 pb-2 border-b border-dashed border-black">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left text-[10px] pb-1">Descripción</th>
              <th className="text-center text-[10px] pb-1 w-8">Cant</th>
              <th className="text-right text-[10px] pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="text-[10px] py-0.5 pr-1 break-words max-w-[120px]">
                  {item.description}
                </td>
                <td className="text-center text-[10px] py-0.5">
                  {parseFloat(item.quantity)}
                </td>
                <td className="text-right text-[10px] py-0.5 whitespace-nowrap">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-2 pb-2 border-b border-dashed border-black text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (16%):</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        {parseFloat(sale.discount) > 0 && (
          <div className="flex justify-between">
            <span>Descuento:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="mb-2 pb-2 border-b border-dashed border-black text-[11px]">
        <p className="font-bold mb-1">Método de Pago:</p>
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}:</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
        ))}
        <p className="text-[10px] mt-2">
          Atendió: {sale.staff?.name || sale.user?.name || 'N/A'}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] mt-3">
        <p className="font-bold">¡Gracias por su preferencia!</p>
        <p className="mt-1">Conserve este ticket para cualquier aclaración</p>
        <p className="mt-2 text-[8px] text-gray-600">
          {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}
        </p>
      </div>
    </div>
  );
}
