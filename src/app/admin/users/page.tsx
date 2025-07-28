'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { UserStats } from '@/components/admin/users/UserStats';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { UserWithRoles, UserFilters as UserFiltersType, UserStats as UserStatsType } from '@/lib/admin/users';

interface UsersData {
  users: UserWithRoles[];
  total: number;
  pages: number;
  currentPage: number;
}

interface Role {
  id: string;
  name: string;
  key: string;
  isSystem: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  _count: {
    users: number;
  };
}

export default function UsersPage() {
  const [usersData, setUsersData] = useState<UsersData>({
    users: [],
    total: 0,
    pages: 0,
    currentPage: 1
  });
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users data
  const fetchUsers = async (page: number = 1, currentFilters: UserFiltersType = filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        includeStats: page === 1 ? 'true' : 'false' // Only fetch stats on first page
      });

      // Add filters to params
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.tenantId) params.append('tenantId', currentFilters.tenantId);
      if (currentFilters.roleId) params.append('roleId', currentFilters.roleId);
      if (currentFilters.isActive !== undefined) params.append('isActive', currentFilters.isActive.toString());
      if (currentFilters.dateFrom) params.append('dateFrom', currentFilters.dateFrom.toISOString());
      if (currentFilters.dateTo) params.append('dateTo', currentFilters.dateTo.toISOString());

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      
      if (data.success) {
        setUsersData(data.data);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        throw new Error(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles and tenants for filters
  const fetchFiltersData = async () => {
    try {
      const response = await fetch('/api/admin/users/roles');
      if (!response.ok) {
        throw new Error('Error al cargar filtros');
      }

      const data = await response.json();
      if (data.success) {
        setRoles(data.data.roles);
        setTenants(data.data.tenants);
      }
    } catch (err) {
      console.error('Error fetching filters data:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchFiltersData();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  // Handle user actions
  const handleUserAction = async (action: 'edit' | 'delete' | 'activate', userId: string) => {
    try {
      setError(null);

      if (action === 'delete') {
        const confirmed = window.confirm('¿Estás seguro de que quieres desactivar este usuario?');
        if (!confirmed) return;

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Error al desactivar usuario');
        }

        const data = await response.json();
        if (data.success) {
          fetchUsers(usersData.currentPage);
        } else {
          throw new Error(data.error || 'Error al desactivar usuario');
        }
      } else if (action === 'activate') {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: true }),
        });

        if (!response.ok) {
          throw new Error('Error al activar usuario');
        }

        const data = await response.json();
        if (data.success) {
          fetchUsers(usersData.currentPage);
        } else {
          throw new Error(data.error || 'Error al activar usuario');
        }
      } else if (action === 'edit') {
        // TODO: Open edit modal or navigate to edit page
        console.log('Edit user:', userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra todos los usuarios del sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              // TODO: Open create user modal
              console.log('Create user');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <UserStats stats={stats} loading={loading && !stats} />
      )}

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        roles={roles}
        tenants={tenants}
        loading={loading}
      />

      {/* Users Table */}
      <UsersTable
        users={usersData.users}
        total={usersData.total}
        currentPage={usersData.currentPage}
        totalPages={usersData.pages}
        onPageChange={handlePageChange}
        onUserAction={handleUserAction}
        loading={loading}
      />
    </div>
  );
} 