'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  TrashIcon,
  PrinterIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { CustomerSearchResult, ProductSearchResult, SaleItemForm } from '@/types';

interface SalesPageClientProps {
  tenantId: string;
  userId: string;
}

export default function SalesPageClient({}: SalesPageClientProps) {
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItemForm[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Buscar clientes
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const response = await fetch(`/api/sales/search?type=customers&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error buscando clientes:', error);
    }
  };

  // Buscar productos
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }

    try {
      const response = await fetch(`/api/sales/search?type=products&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error buscando productos:', error);
    }
  };

  // Agregar producto al carrito
  const addToCart = (product: ProductSearchResult) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.itemId === product.id || item.serviceId === product.id
    );

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const newItems = [...cartItems];
      newItems[existingItemIndex].quantity += 1;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unitPrice;
      setCartItems(newItems);
    } else {
      // Agregar nuevo item
      const newItem: SaleItemForm = {
        type: product.type,
        itemId: product.type === 'product' ? product.id : undefined,
        serviceId: product.type === 'service' ? product.id : undefined,
        description: product.name,
        quantity: 1,
        unitPrice: product.price || 0,
        discount: 0,
        total: product.price || 0
      };
      setCartItems([...cartItems, newItem]);
    }

    setProductQuery('');
    setProducts([]);
    setShowProductSearch(false);
  };

  // Remover del carrito
  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Actualizar cantidad
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    const newItems = [...cartItems];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * newItems[index].unitPrice - (newItems[index].discount || 0);
    setCartItems(newItems);
  };

  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.16; // 16% IVA - esto debería venir de la configuración del tenant
  const total = subtotal + tax;

  // Procesar venta
  const processSale = async () => {
    if (!selectedCustomer || cartItems.length === 0) {
      alert('Selecciona un cliente y agrega productos');
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        customerId: selectedCustomer.id,
        petId: selectedPet || undefined,
        items: cartItems,
        tax,
        paymentMethod: 'CASH', // Por simplicidad, por ahora solo efectivo
        amountPaid: total,
        notes: ''
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const sale = await response.json();
        
        // Limpiar formulario
        setSelectedCustomer(null);
        setSelectedPet('');
        setCartItems([]);
        setCustomerQuery('');
        
        alert(`Venta procesada exitosamente. Número: ${sale.saleNumber}`);
        
        // Aquí podrías abrir una ventana de impresión o generar un PDF
      } else {
        throw new Error('Error procesando la venta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error procesando la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  // Effects
  useEffect(() => {
    searchCustomers(customerQuery);
  }, [customerQuery]);

  useEffect(() => {
    searchProducts(productQuery);
  }, [productQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo - Búsqueda y selección */}
      <div className="space-y-6">
        {/* Búsqueda de cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Cliente
          </h3>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, teléfono o email..."
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              onFocus={() => setShowCustomerSearch(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#75a99c] focus:border-[#75a99c] dark:bg-gray-700 dark:text-gray-100"
            />
            
            {/* Resultados de búsqueda de clientes */}
            {showCustomerSearch && customers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerQuery(customer.name);
                      setShowCustomerSearch(false);
                    }}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {customer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone} • {customer.email}
                    </div>
                    {customer.pets.length > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Mascotas: {customer.pets.map(pet => pet.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selección de mascota */}
          {selectedCustomer && selectedCustomer.pets.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mascota (opcional)
              </label>
              <select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#75a99c] focus:border-[#75a99c] dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Seleccionar mascota</option>
                {selectedCustomer.pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} - {pet.species} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Búsqueda de productos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Productos y Servicios
          </h3>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos o servicios..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              onFocus={() => setShowProductSearch(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#75a99c] focus:border-[#75a99c] dark:bg-gray-700 dark:text-gray-100"
            />
            
            {/* Resultados de búsqueda de productos */}
            {showProductSearch && products.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category}
                          {product.type === 'product' && ` • Stock: ${product.quantity}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#75a99c]">
                          ${product.price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.type === 'product' ? 'Producto' : 'Servicio'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel derecho - Carrito y total */}
      <div className="space-y-6">
        {/* Carrito de compras */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Carrito de Compras
          </h3>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay productos en el carrito
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${item.unitPrice.toFixed(2)} c/u
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded focus:ring-[#75a99c] focus:border-[#75a99c] dark:bg-gray-700 dark:text-gray-100"
                    />
                    
                    <div className="font-medium text-[#75a99c] min-w-[60px] text-right">
                      ${item.total.toFixed(2)}
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen y pago */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Resumen
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                <span className="text-lg font-semibold text-[#75a99c]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={processSale}
              disabled={!selectedCustomer || cartItems.length === 0 || isProcessing}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#75a99c] hover:bg-[#5b9788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              {isProcessing ? 'Procesando...' : 'Procesar Venta'}
            </button>
            
            <button
              disabled={cartItems.length === 0}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 