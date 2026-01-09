'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { InventoryItemWithStock } from '@/types';
import { Badge } from '../ui/badge';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import { getInventoryCategories } from '../../lib/inventory';
import { INVENTORY_UPDATED_EVENT } from './LowStockAlert';
import { ResponsiveTable } from '../ui/ResponsiveTable';
import { themeColors, responsive } from '../../utils/theme-colors';
import { useLocation } from '@/components/providers/LocationProvider';

interface InventoryMainProps {
  tenantId: string;
}

export function InventoryMain({ tenantId }: InventoryMainProps) {
  const { currentLocation, availableLocations } = useLocation();
  const [items, setItems] = useState<InventoryItemWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;
  const categories = getInventoryCategories();

  // Use current location as default filter
  useEffect(() => {
    if (currentLocation?.id && !selectedLocationId) {
      setSelectedLocationId(currentLocation.id);
    }
  }, [currentLocation, selectedLocationId]);

  const fetchItems = useCallback(async (page = 1, search = '', category = '', locationId = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(locationId && { locationId })
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
  }, [tenantId, itemsPerPage]);

  useEffect(() => {
    fetchItems(currentPage, searchQuery, selectedCategory, selectedLocationId);
  }, [fetchItems, currentPage, searchQuery, selectedCategory, selectedLocationId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
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
        fetchItems(currentPage, searchQuery, selectedCategory, selectedLocationId);
        // Notify LowStockAlert to refresh
        window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT));
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

  // Define columns for the responsive table
  const columns = [
    {
      key: 'name',
      header: 'Producto',
      mobileLabel: 'Producto',
      render: (item: InventoryItemWithStock) => (
        <div>
          <div className={`text-sm font-medium ${themeColors.text.primary}`}>
            {item.name}
          </div>
          {item.brand && (
            <div className={`text-sm ${themeColors.text.secondary}`}>
              {item.brand}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      mobileLabel: 'Categoría',
      render: (item: InventoryItemWithStock) => (
        <span className={`text-sm ${themeColors.text.primary}`}>
          {categories.find(c => c.value === item.category)?.label || item.category}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Ubicación',
      mobileLabel: 'Ubicación',
      render: (item: InventoryItemWithStock) => {
        const branchName = item.location?.name;
        const storageLoc = item.storageLocation;
        let displayText = 'Sin ubicación';

        if (branchName && storageLoc) {
          displayText = `${branchName} > ${storageLoc}`;
        } else if (branchName) {
          displayText = branchName;
        } else if (storageLoc) {
          displayText = storageLoc;
        }

        return (
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-gray-400" />
            <span className={`text-sm ${themeColors.text.primary}`}>
              {displayText}
            </span>
          </div>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Stock',
      mobileLabel: 'Stock',
      render: (item: InventoryItemWithStock) => (
        <div>
          <div className={`text-sm ${themeColors.text.primary}`}>
            {Number(item.quantity)} {item.measure}
          </div>
          {item.minStock && (
            <div className={`text-xs ${themeColors.text.secondary}`}>
              Mín: {Number(item.minStock)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      mobileLabel: 'Precio',
      render: (item: InventoryItemWithStock) => (
        <span className={`text-sm ${themeColors.text.primary}`}>
          {item.price ? `$${Number(item.price).toFixed(2)}` : '-'}
        </span>
      ),
    },
    {
      key: 'expirationDate',
      header: 'Vencimiento',
      mobileLabel: 'Vence',
      render: (item: InventoryItemWithStock) => (
        <span className={`text-sm ${themeColors.text.primary}`}>
          {formatDate(item.expirationDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      mobileLabel: 'Estado',
      render: (item: InventoryItemWithStock) => {
        const stockStatus = getStockStatus(item);
        return (
          <Badge className={stockStatus.color}>
            {stockStatus.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      mobileLabel: 'Acciones',
      className: 'text-right',
      render: (item: InventoryItemWithStock) => (
        <div className="flex items-center justify-end sm:justify-center space-x-2">
          <button
            onClick={() => handleEdit(item)}
            className={`${themeColors.text.accent} hover:opacity-75 p-1 rounded transition-opacity`}
            title="Editar"
            data-testid="edit-product-button"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors"
            title="Eliminar"
            data-testid="delete-product-button"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div id="inventory-main" className={`${themeColors.background.card} shadow rounded-lg border ${themeColors.border.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`${responsive.padding.card} border-b ${themeColors.border.primary}`}>
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={`text-lg leading-6 font-medium ${themeColors.text.primary}`}>
              Productos del Inventario
            </h3>
            <p className={`mt-1 text-sm ${themeColors.text.secondary}`}>
              Gestiona los productos, medicamentos y suministros de la clínica
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
              data-testid="add-product-button"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Agregar Producto</span>
              <span className="sm:hidden">Agregar</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={handleSearch}
              className="form-input pl-10"
              data-testid="product-search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex-shrink-0"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={`mt-4 p-4 ${themeColors.background.secondary} rounded-lg`}>
            <div className={`${responsive.grid.form} gap-4`}>
              <div>
                <label className="form-label">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              {availableLocations.length > 1 && (
                <div>
                  <label className="form-label">
                    Ubicación
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Todas las ubicaciones</option>
                    {availableLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items List - Using ResponsiveTable */}
      <ResponsiveTable
        data={items}
        columns={columns}
        loading={loading}
        emptyMessage="No se encontraron productos."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`${responsive.padding.card} border-t ${themeColors.border.primary}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className={`text-sm ${themeColors.text.secondary} text-center sm:text-left`}>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} productos
            </div>
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">‹</span>
              </button>
              <span className={`px-3 py-1 text-sm font-medium ${themeColors.text.primary}`}>
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">›</span>
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
          fetchItems(currentPage, searchQuery, selectedCategory, selectedLocationId);
          // Notify LowStockAlert to refresh
          window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT));
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
            fetchItems(currentPage, searchQuery, selectedCategory, selectedLocationId);
            // Notify LowStockAlert to refresh
            window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT));
          }}
          item={selectedItem}
          tenantId={tenantId}
        />
      )}
    </div>
  );
} 