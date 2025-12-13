'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getInventoryCategories } from '../../lib/inventory';
import { themeColors, responsive } from '../../utils/theme-colors';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

interface ProductFormData {
  name: string;
  category: string;
  description: string;
  activeCompound: string;
  presentation: string;
  measure: string;
  brand: string;
  quantity: number;
  minStock: number;
  storageLocation: string;
  expirationDate: string;
  cost: number;
  price: number;
  batchNumber: string;
  specialNotes: string;
}

export function AddProductModal({ isOpen, onClose, onSuccess, tenantId }: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    description: '',
    activeCompound: '',
    presentation: '',
    measure: '',
    brand: '',
    quantity: 0,
    minStock: 0,
    storageLocation: '',
    expirationDate: '',
    cost: 0,
    price: 0,
    batchNumber: '',
    specialNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = getInventoryCategories();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'minStock' || name === 'cost' || name === 'price' 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      setError('El nombre y la categoría son obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantId,
          expirationDate: formData.expirationDate || undefined
        })
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '',
          category: '',
          description: '',
          activeCompound: '',
          presentation: '',
          measure: '',
          brand: '',
          quantity: 0,
          minStock: 0,
          location: '',
          expirationDate: '',
          cost: 0,
          price: 0,
          batchNumber: '',
          specialNotes: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear el producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${themeColors.modal.backdrop} overflow-y-auto h-full w-full z-50`}>
      <div className={`relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border ${responsive.modal} shadow-lg rounded-md ${themeColors.modal.content}`}>
        <div className={`flex items-center justify-between pb-3 border-b ${themeColors.modal.header}`}>
          <h3 className={`text-lg font-medium ${themeColors.text.primary}`}>
            Agregar Producto
          </h3>
          <button
            onClick={onClose}
            className={`${themeColors.text.secondary} hover:opacity-75 transition-opacity`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          {error && (
            <div className={`mb-4 p-4 ${themeColors.status.error} border rounded-md`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className={`${responsive.grid.form} gap-4`}>
            {/* Información básica */}
            <div className="col-span-full">
              <h4 className={`text-md font-medium ${themeColors.text.primary} mb-3`}>
                Información Básica
              </h4>
            </div>

            <div>
              <label className="form-label">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Marca
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Presentación
              </label>
              <input
                type="text"
                name="presentation"
                value={formData.presentation}
                onChange={handleInputChange}
                placeholder="ej: Tableta, Ampolla, Frasco"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unidad de Medida
              </label>
              <input
                type="text"
                name="measure"
                value={formData.measure}
                onChange={handleInputChange}
                placeholder="ej: mg, ml, unidades"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Principio Activo
              </label>
              <input
                type="text"
                name="activeCompound"
                value={formData.activeCompound}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Stock y precios */}
            <div className="md:col-span-2 mt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Stock y Precios
              </h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad Inicial
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Costo
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio de Venta
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Información adicional */}
            <div className="md:col-span-2 mt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Información Adicional
              </h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                name="storageLocation"
                value={formData.storageLocation}
                onChange={handleInputChange}
                placeholder="ej: Estante A, Refrigerador"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Lote
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas Especiales
              </label>
              <textarea
                name="specialNotes"
                value={formData.specialNotes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Instrucciones de manejo, almacenamiento, etc."
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#75a99c] hover:bg-[#5b9788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Agregar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 