'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { ServiceCategory } from '@prisma/client';
import { ServiceModal } from './ServiceModal';
import { ServiceWithCategory } from '@/types';

interface ServiceManagementProps {
  tenantId: string;
}

export function ServiceManagement({ tenantId }: ServiceManagementProps) {
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'ALL'>('ALL');

  // Cargar servicios
  const loadServices = useCallback(async () => {
    try {
      const response = await fetch(`/api/services?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Filtrar servicios
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Abrir modal para nuevo servicio
  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar servicio
  const handleEditService = (service: ServiceWithCategory) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  // Eliminar servicio
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceId));
      } else {
        alert('Error al eliminar el servicio');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error al eliminar el servicio');
    }
  };

  // Callback cuando se guarda un servicio
  const handleServiceSaved = (service: ServiceWithCategory) => {
    if (editingService) {
      // Actualizar servicio existente
      setServices(services.map(s => s.id === service.id ? service : s));
    } else {
      // Agregar nuevo servicio
      setServices([...services, service]);
    }
    setIsModalOpen(false);
    setEditingService(null);
  };

  // Categorías de servicios
  const serviceCategories = [
    { value: 'ALL', label: 'Todos los servicios' },
    { value: 'CONSULTATION', label: 'Consultas' },
    { value: 'SURGERY', label: 'Cirugías' },
    { value: 'VACCINATION', label: 'Vacunación' },
    { value: 'DEWORMING', label: 'Desparasitación' },
    { value: 'PREVENTATIVE_CARE', label: 'Medicina Preventiva' },
    { value: 'GROOMING', label: 'Estética' },
    { value: 'BOARDING', label: 'Hospitalización' },
    { value: 'DENTAL_CARE', label: 'Cuidado Dental' },
    { value: 'LABORATORY_TEST', label: 'Análisis de Laboratorio' },
    { value: 'IMAGING_RADIOLOGY', label: 'Radiografías/Imágenes' },
    { value: 'HOSPITALIZATION', label: 'Hospitalización' },
    { value: 'EMERGENCY_CARE', label: 'Atención de Emergencia' },
    { value: 'EUTHANASIA', label: 'Eutanasia' },
    { value: 'OTHER', label: 'Otros' }
  ];

  // Obtener etiqueta de categoría
  const getCategoryLabel = (category: ServiceCategory) => {
    return serviceCategories.find(c => c.value === category)?.label || category;
  };

  // Obtener color de categoría
  const getCategoryColor = (category: ServiceCategory) => {
    const colors: Record<ServiceCategory, string> = {
      CONSULTATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      SURGERY: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      VACCINATION: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      DEWORMING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PREVENTATIVE_CARE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      GROOMING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      BOARDING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      DENTAL_CARE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      LABORATORY_TEST: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      IMAGING_RADIOLOGY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      HOSPITALIZATION: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      EMERGENCY_CARE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      EUTHANASIA: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      OTHER: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    };
    return colors[category] || colors.OTHER;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header con búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ServiceCategory | 'ALL')}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 appearance-none"
            >
              {serviceCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleAddService}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {service.name}
                </h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                  {getCategoryLabel(service.category)}
                </span>
              </div>
              
              <div className="flex space-x-1 ml-2">
                <button
                  onClick={() => handleEditService(service)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {service.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {service.description}
              </p>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${typeof service.price === 'number' ? service.price : Number(service.price)}
              </span>
              {service.duration && (
                <span className="text-gray-500 dark:text-gray-400">
                  {service.duration} min
                </span>
              )}
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <span className={`text-xs px-2 py-1 rounded-full ${
                service.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {service.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🏥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No hay servicios
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedCategory !== 'ALL' 
              ? 'No se encontraron servicios con los filtros seleccionados.'
              : 'Comienza agregando los primeros servicios de tu clínica.'
            }
          </p>
          {(!searchTerm && selectedCategory === 'ALL') && (
            <button
              onClick={handleAddService}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Primer Servicio
            </button>
          )}
        </div>
      )}

      {/* Modal para crear/editar servicio */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleServiceSaved}
        service={editingService}
        tenantId={tenantId}
      />
    </div>
  );
} 