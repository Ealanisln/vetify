'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CustomersList } from '../../../components/customers/CustomersList';
import { CustomerStats } from '../../../components/customers/CustomerStats';
import { PaginationControls } from '../../../components/ui/PaginationControls';
import { Button } from '../../../components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import type { SortOrder } from '@/components/ui/ResponsiveTable';

interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  pets?: {
    id: string;
    name: string;
    species: string;
  }[];
  _count?: {
    pets: number;
    appointments: number;
  };
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function CustomersPageClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Clinic-wide total for the stats, unaffected by the search
  const [totalCustomers, setTotalCustomers] = useState(0);
  const requestIdRef = useRef(0);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  // Sorting state - default to alphabetical order by name
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { currentLocation, isAllLocations } = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCustomers = useCallback(async (page: number = 1) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!isAllLocations && currentLocation?.id) {
        params.set('locationId', currentLocation.id);
      }

      // Add pagination params
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));

      // Add sorting params
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const url = `/api/customers?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();

      // A newer request (e.g. the next keystroke) superseded this one
      if (requestId !== requestIdRef.current) return;

      // Handle paginated response
      if (data.success && data.data && data.pagination) {
        setCustomers(data.data);
        if (!debouncedSearch) setTotalCustomers(data.pagination.total);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } else {
        // Fallback for legacy response format
        const customersArray = Array.isArray(data) ? data : (data.data || []);
        setCustomers(customersArray);
        if (!debouncedSearch) setTotalCustomers(customersArray.length);
        setPagination({
          page: 1,
          limit: ITEMS_PER_PAGE,
          total: customersArray.length,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }
  }, [currentLocation?.id, isAllLocations, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchCustomers(1); // Reset to page 1 when filters change
  }, [currentLocation?.id, isAllLocations, sortBy, sortOrder, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for initial load
  useEffect(() => {
    fetchCustomers(pagination.page);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage);
  };

  const handleSort = (newSortBy: string, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // fetchCustomers will be called automatically due to useEffect dependency
  };

  // Full-page spinner only on the first load, so the search box keeps focus
  if (isLoading && !hasLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
          </div>
          <Link href="/dashboard/customers/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => fetchCustomers(pagination.page)} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="inline-flex items-center" data-testid="add-customer-button">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats - use total from pagination for accuracy */}
      <CustomerStats customers={customers} totalCustomers={totalCustomers} />

      {/* Customers List with sorting */}
      <CustomersList
        customers={customers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        isLoading={isLoading}
      />

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        itemLabel="clientes"
      />
    </div>
  );
}
