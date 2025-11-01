'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StaffModal from './StaffModal';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    appointments: number;
    medicalHistories: number;
    medicalOrders: number;
    Sale: number;
  };
}

interface StaffListProps {
  initialStaff: StaffMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function StaffList({ initialStaff, pagination: initialPagination }: StaffListProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Fetch staff data
  const fetchStaff = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (positionFilter.trim()) {
        params.append('position', positionFilter.trim());
      }
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`/api/staff?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data.staff);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Error al cargar el personal');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [search, positionFilter, statusFilter]);

  // Handle staff deletion
  const handleDelete = async (staffId: string, staffName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${staffName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchStaff(pagination.page);
      } else {
        toast.error(data.message || 'Error al eliminar personal');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Error de conexión');
    }
  };

  // Handle search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStaff(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, positionFilter, statusFilter, fetchStaff]);

  const openModal = (mode: 'create' | 'edit' | 'view', staffMember?: StaffMember) => {
    setModalMode(mode);
    setSelectedStaff(staffMember || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  const handleStaffSaved = () => {
    fetchStaff(pagination.page);
    closeModal();
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
        }
      >
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  const positions = [...new Set(staff.map(s => s.position))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Personal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra el equipo de tu veterinaria
          </p>
        </div>
        <Button onClick={() => openModal('create')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
          <UserPlusIcon className="h-4 w-4" />
          Agregar Personal
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">Todas las posiciones</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              {pagination.total} {pagination.total === 1 ? 'miembro' : 'miembros'} del personal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Personal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando personal...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12">
              <UserPlusIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay personal registrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comienza agregando miembros a tu equipo de trabajo.
              </p>
              <Button onClick={() => openModal('create')} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                Agregar primer miembro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-gray-100">{staffMember.name}</h3>
                        {getStatusBadge(staffMember.isActive)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Posición:</span> {staffMember.position}
                        </div>
                        {staffMember.email && (
                          <div className="truncate">
                            <span className="font-medium">Email:</span> {staffMember.email}
                          </div>
                        )}
                        {staffMember.phone && (
                          <div>
                            <span className="font-medium">Teléfono:</span> {staffMember.phone}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Agregado:</span> {format(new Date(staffMember.createdAt), 'd MMM yyyy', { locale: es })}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{staffMember._count.appointments} citas</span>
                        <span>{staffMember._count.medicalHistories} historiales</span>
                        <span>{staffMember._count.Sale} ventas</span>
                      </div>
                    </div>

                    {/* Desktop buttons */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('view', staffMember)}
                        className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('edit', staffMember)}
                        className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(staffMember.id, staffMember.name)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:border-red-600/50 dark:hover:bg-red-900/20"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex lg:hidden flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('view', staffMember)}
                        className="flex-1 flex items-center justify-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('edit', staffMember)}
                        className="flex-1 flex items-center justify-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(staffMember.id, staffMember.name)}
                        className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:border-red-600/50 dark:hover:bg-red-900/20"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchStaff(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchStaff(pagination.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        staff={selectedStaff}
        onStaffSaved={handleStaffSaved}
      />
    </div>
  );
} 