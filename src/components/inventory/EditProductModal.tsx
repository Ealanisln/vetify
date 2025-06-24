'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getInventoryCategories } from '@/lib/inventory';
import { InventoryItemWithStock } from '@/types';
import { getThemeClasses } from '@/utils/theme-colors';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItemWithStock;
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
  location: string;
  expirationDate: string;
  cost: number;
  price: number;
  batchNumber: string;
  specialNotes: string;
}

export function EditProductModal({ isOpen, onClose, onSuccess, item, tenantId }: EditProductModalProps) {
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
    location: '',
    expirationDate: '',
    cost: 0,
    price: 0,
    batchNumber: '',
    specialNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = getInventoryCategories();

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        description: item.description || '',
        activeCompound: item.activeCompound || '',
        presentation: item.presentation || '',
        measure: item.measure || '',
        brand: item.brand || '',
        quantity: Number(item.quantity) || 0,
        minStock: Number(item.minStock) || 0,
        location: item.location || '',
        expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
        cost: Number(item.cost) || 0,
        price: Number(item.price) || 0,
        batchNumber: item.batchNumber || '',
        specialNotes: item.specialNotes || ''
      });
    }
  }, [item]);

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
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantId,
          expirationDate: formData.expirationDate || undefined
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${getThemeClasses('background.overlay')} overflow-y-auto h-full w-full z-50`}>
      <div className="relative top-4 md:top-20 mx-auto p-4 md:p-5 w-full max-w-2xl md:w-11/12 shadow-lg">
        <div className={`${getThemeClasses('background.card', 'border.card')} rounded-md p-4 md:p-6`}>
          <div className={`flex items-center justify-between pb-3 border-b ${getThemeClasses('border.card')}`}>
            <h3 className={`text-base md:text-lg font-medium ${getThemeClasses('text.primary')}`}>
              Editar Producto: {item.name}
            </h3>
            <button
              onClick={onClose}
              className={`${getThemeClasses('text.tertiary')} hover:${getThemeClasses('text.secondary')}`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            {error && (
              <div className={`mb-4 p-4 ${getThemeClasses('background.error')} ${getThemeClasses('border.error')} border rounded-md`}>
                <p className={`text-sm ${getThemeClasses('text.error')}`}>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información básica */}
              <div className="md:col-span-2">
                <h4 className={`text-md font-medium ${getThemeClasses('text.primary')} mb-3`}>
                  Información Básica
                </h4>
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
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
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Categoría *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="form-input"
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
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
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
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Presentación
                </label>
                <input
                  type="text"
                  name="presentation"
                  value={formData.presentation}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ej: Tabletas, Ampolla, Frasco"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input"
                />
              </div>

              {/* Inventario */}
              <div className="md:col-span-2">
                <h4 className={`text-md font-medium ${getThemeClasses('text.primary')} mb-3 mt-6`}>
                  Inventario
                </h4>
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ej: Estante A-1"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Precios */}
              <div className="md:col-span-2">
                <h4 className={`text-md font-medium ${getThemeClasses('text.primary')} mb-3 mt-6`}>
                  Precios
                </h4>
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Costo *
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="form-input"
                />
              </div>

              {/* Información adicional */}
              <div className="md:col-span-2">
                <h4 className={`text-md font-medium ${getThemeClasses('text.primary')} mb-3 mt-6`}>
                  Información Adicional
                </h4>
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Número de Lote
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Compuesto Activo
                </label>
                <input
                  type="text"
                  name="activeCompound"
                  value={formData.activeCompound}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${getThemeClasses('text.secondary')} mb-1`}>
                  Notas Especiales
                </label>
                <textarea
                  name="specialNotes"
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary order-1 sm:order-2"
              >
                {loading ? 'Actualizando...' : 'Actualizar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 