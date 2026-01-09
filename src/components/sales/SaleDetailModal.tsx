'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PrinterIcon, ReceiptPercentIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTaxRateLabel, calculateTaxBreakdown } from '@/lib/tax-utils';

interface SaleDetailModalProps {
  saleId: string | null;
  open: boolean;
  onClose: () => void;
}

export interface SaleDetail {
  id: string;
  saleNumber: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: string;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  staff: {
    id: string;
    name: string;
  } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    total: string;
    inventoryItem: {
      id: string;
      name: string;
    } | null;
    service: {
      id: string;
      name: string;
      category: string;
    } | null;
  }>;
  payments: Array<{
    id: string;
    paymentMethod: string;
    amount: string;
    paymentDate: string;
    notes: string | null;
  }>;
  tenant: {
    name: string;
    publicPhone: string | null;
    publicEmail: string | null;
    publicAddress: string | null;
    tenantSettings: {
      taxRate: string | null;
    } | null;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  PAID: { label: 'Pagado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  PARTIALLY_PAID: { label: 'Pago Parcial', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  REFUNDED: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' }
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT_CARD: 'Tarjeta de Débito',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro'
};

const CATEGORY_LABELS: Record<string, string> = {
  // Categorías de inventario
  MEDICINE: 'Medicamento',
  FOOD: 'Alimento',
  ACCESSORY: 'Accesorio',
  SUPPLEMENT: 'Suplemento',
  HYGIENE: 'Higiene',
  EQUIPMENT: 'Equipo',
  OTHER: 'Otro',
  // Categorías de servicios
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirugía',
  VACCINATION: 'Vacunación',
  GROOMING: 'Estética',
  LABORATORY: 'Laboratorio',
  IMAGING: 'Imagenología',
  DENTAL: 'Dental',
  EMERGENCY: 'Emergencia',
  HOSPITALIZATION: 'Hospitalización',
  DEWORMING: 'Desparasitación'
};

export function SaleDetailModal({ saleId, open, onClose }: SaleDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      fetchSaleDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saleId]);

  const fetchSaleDetails = async () => {
    if (!saleId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al cargar venta');
      }

      setSale(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar venta');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM yyyy, HH:mm", { locale: es });
  };

  const formatDateShort = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (!open) return null;

  const statusInfo = sale ? STATUS_LABELS[sale.status] || { label: sale.status, color: 'bg-gray-100 text-gray-800' } : null;

  return (
    <>
      {/* Print-only ticket view */}
      {sale && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
          <div className="ticket-print-container font-mono text-xs p-2 max-w-[80mm] mx-auto">
            {/* Header */}
            <div className="text-center mb-2 pb-2 border-b border-dashed border-black">
              <h1 className="text-sm font-bold">{sale.tenant.name}</h1>
              {sale.tenant.publicAddress && <p className="text-[10px]">{sale.tenant.publicAddress}</p>}
              {sale.tenant.publicPhone && <p className="text-[10px]">Tel: {sale.tenant.publicPhone}</p>}
            </div>

            {/* Sale Info */}
            <div className="mb-2 pb-2 border-b border-dashed border-black">
              <p><strong>Ticket:</strong> #{sale.saleNumber}</p>
              <p><strong>Fecha:</strong> {formatDateShort(sale.createdAt)}</p>
              <p><strong>Cliente:</strong> {sale.customer?.name || 'General'}</p>
              {sale.pet && <p><strong>Mascota:</strong> {sale.pet.name}</p>}
            </div>

            {/* Items */}
            <table className="w-full mb-2 pb-2 border-b border-dashed border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left text-[10px]">Producto</th>
                  <th className="text-center text-[10px]">Cant</th>
                  <th className="text-right text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-[10px] py-0.5">{item.description}</td>
                    <td className="text-center text-[10px]">{parseFloat(item.quantity)}</td>
                    <td className="text-right text-[10px]">{formatCurrency(item.total).replace('MX$', '$')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            {(() => {
              const taxRate = Number(sale.tenant.tenantSettings?.taxRate) || 0.16;
              const totalAmount = parseFloat(sale.total) + parseFloat(sale.discount);
              const taxBreakdown = calculateTaxBreakdown(totalAmount, taxRate);
              return (
                <div className="mb-2 pb-2 border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>Subtotal (sin IVA):</span>
                    <span>{formatCurrency(taxBreakdown.subtotalWithoutTax).replace('MX$', '$')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA incluido ({formatTaxRateLabel(taxRate)}):</span>
                    <span>{formatCurrency(taxBreakdown.taxAmount).replace('MX$', '$')}</span>
                  </div>
                  {parseFloat(sale.discount) > 0 && (
                    <div className="flex justify-between">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(sale.discount).replace('MX$', '$')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total).replace('MX$', '$')}</span>
                  </div>
                </div>
              );
            })()}

            {/* Payment */}
            <div className="mb-2 pb-2 border-b border-dashed border-black">
              {sale.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between">
                  <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}:</span>
                  <span>{formatCurrency(payment.amount).replace('MX$', '$')}</span>
                </div>
              ))}
              <p className="text-[10px] mt-1">Atendió: {sale.staff?.name || sale.user?.name || 'N/A'}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px]">
              <p>¡Gracias por su preferencia!</p>
              <p className="mt-1">Conserve este ticket</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal - hidden when printing */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${isPrinting ? 'print:hidden' : ''}`}>
        <div className="flex min-h-full items-center justify-center p-4 print:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />

          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" data-testid="sale-detail-modal">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ReceiptPercentIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {sale ? `Venta #${sale.saleNumber}` : 'Detalle de Venta'}
                </h2>
                {statusInfo && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {sale && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                    data-testid="print-sale-button"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Imprimir
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md"
                  data-testid="close-sale-modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {error}
                </div>
              ) : sale ? (
                <div className="space-y-6">
                  {/* Sale Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(sale.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1">Atendido por</p>
                      <p className="text-sm font-medium text-foreground">
                        {sale.staff?.name || sale.user?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Customer & Pet Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Cliente
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{sale.customer?.name || 'Cliente General'}</p>
                        {sale.customer?.phone && (
                          <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>
                        )}
                        {sale.customer?.email && (
                          <p className="text-xs text-muted-foreground">{sale.customer.email}</p>
                        )}
                      </div>
                      {sale.pet && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mascota</p>
                          <p className="text-sm font-medium text-foreground">{sale.pet.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.pet.species}{sale.pet.breed && ` - ${sale.pet.breed}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Productos y Servicios ({sale.items.length})
                    </h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Cant.</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">P. Unit.</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {sale.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">
                                <p className="font-medium text-foreground">{item.description}</p>
                                {item.service && (
                                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.service.category] || item.service.category}</p>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-foreground">
                                {parseFloat(item.quantity)}
                              </td>
                              <td className="px-3 py-2 text-right text-muted-foreground">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4">
                    {(() => {
                      const taxRate = Number(sale.tenant.tenantSettings?.taxRate) || 0.16;
                      const totalAmount = parseFloat(sale.total) + parseFloat(sale.discount);
                      const taxBreakdown = calculateTaxBreakdown(totalAmount, taxRate);
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal (sin IVA):</span>
                            <span className="font-medium text-foreground">{formatCurrency(taxBreakdown.subtotalWithoutTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IVA incluido ({formatTaxRateLabel(taxRate)}):</span>
                            <span className="font-medium text-foreground">{formatCurrency(taxBreakdown.taxAmount)}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {parseFloat(sale.discount) > 0 && (
                      <div className="flex justify-between text-red-600 dark:text-red-400 text-sm">
                        <span>Descuento:</span>
                        <span>-{formatCurrency(sale.discount)}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                      <span className="text-lg font-semibold text-foreground">Total:</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(sale.total)}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Pago
                    </h4>
                    {sale.payments.length > 0 ? (
                      <div className="space-y-2">
                        {sale.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-400">
                              {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                            </span>
                            <span className="font-medium text-green-800 dark:text-green-300">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin información de pago</p>
                    )}
                  </div>

                  {/* Notes */}
                  {sale.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-4">
                      <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">Notas</h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">{sale.notes}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
