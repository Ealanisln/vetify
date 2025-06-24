'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { InventoryItemWithStock } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import { getInventoryCategories } from '@/lib/inventory';

interface InventoryMainProps {
  tenantId: string;
}

export function InventoryMain({ tenantId }: InventoryMainProps) {
  const [items, setItems] = useState<InventoryItemWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const itemsPerPage = 20;
  const categories = getInventoryCategories();

  const fetchItems = async (page = 1, search = '', category = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(category && { category })
      });

      const response = await fetch(`/api/inventory?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, searchQuery, selectedCategory);
  }, [tenantId, currentPage, searchQuery, selectedCategory]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleEdit = (item: InventoryItemWithStock) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (item: InventoryItemWithStock) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchItems(currentPage, searchQuery, selectedCategory);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getStockStatus = (item: InventoryItemWithStock) => {
    const quantity = Number(item.quantity);
    const minStock = Number(item.minStock || 0);

    if (quantity === 0) {
      return { status: 'Sin Stock', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
    } else if (quantity <= minStock) {
      return { status: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' };
    } else {
      return { status: 'En Stock', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' };
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div id="inventory-main" className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Productos del Inventario
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestiona los productos, medicamentos y suministros de la clínica
            </p>
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#75a99c] hover:bg-[#5b9788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar Producto
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#75a99c] focus:border-[#75a99c]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c]"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#75a99c] focus:border-[#75a99c] bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c] mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando productos...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron productos.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-[#75a99c] hover:text-[#5b9788] font-medium"
            >
              Agregar primer producto
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        {item.brand && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.brand}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {categories.find(c => c.value === item.category)?.label || item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {Number(item.quantity)} {item.measure}
                      </div>
                      {item.minStock && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Mín: {Number(item.minStock)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.price ? `$${Number(item.price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(item.expirationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[#75a99c] hover:text-[#5b9788] p-1 rounded"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} productos
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchItems(currentPage, searchQuery, selectedCategory);
        }}
        tenantId={tenantId}
      />
      
      {selectedItem && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            fetchItems(currentPage, searchQuery, selectedCategory);
          }}
          item={selectedItem}
          tenantId={tenantId}
        />
      )}
    </div>
  );
} 