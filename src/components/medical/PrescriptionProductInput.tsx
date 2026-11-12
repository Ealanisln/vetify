'use client';

import { useEffect, useState } from 'react';

export interface InventoryProductOption {
  id: string;
  name: string;
  presentation?: string | null;
  quantity?: string | number | null;
}

interface PrescriptionProductInputProps {
  /** Medication name shown in the input (free text or the linked product). */
  value: string;
  /** Linked inventory product, if the name came from the selector. */
  productId?: string;
  /** Free-text edit: the parent must unlink any product. */
  onChange: (name: string) => void;
  onSelectProduct: (product: InventoryProductOption) => void;
}

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

/**
 * Medication name with suggestions from the clinic inventory. Picking a
 * suggestion links the prescription to that product; typing keeps it as free
 * text (stored in the record notes).
 */
export function PrescriptionProductInput({ value, productId, onChange, onSelectProduct }: PrescriptionProductInputProps) {
  const [options, setOptions] = useState<InventoryProductOption[]>([]);
  const query = productId ? '' : value.trim();

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/inventory?search=${encodeURIComponent(query)}&limit=5`);
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled) setOptions(Array.isArray(body?.items) ? body.items : []);
      } catch (error) {
        console.error('Error searching inventory products:', error);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const selectProduct = (product: InventoryProductOption) => {
    setOptions([]);
    onSelectProduct(product);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Nombre del medicamento"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
      {productId && (
        <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
          Del inventario
        </span>
      )}
      {options.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <p className="px-3 pt-2 text-xs text-gray-500 dark:text-gray-400">Productos del inventario</p>
          {options.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => selectProduct(product)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
              {product.presentation && (
                <span className="text-gray-600 dark:text-gray-400"> · {product.presentation}</span>
              )}
              {product.quantity !== undefined && product.quantity !== null && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Existencia: {Number(product.quantity)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
