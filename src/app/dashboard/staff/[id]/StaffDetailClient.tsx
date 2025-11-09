'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { 
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StaffModal from '../../../../components/staff/StaffModal';
import { StaffLocationManager } from '../../../../components/staff/StaffLocationManager';
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
  appointments?: unknown[];
  medicalHistories?: unknown[];
  Sale?: unknown[];
  _count: {
    appointments: number;
    medicalHistories: number;
    medicalOrders: number;
    Sale: number;
    inventoryMovements?: number;
    treatmentRecords?: number;
  };
}

interface StaffDetailClientProps {
  initialStaff: StaffMember;
  tenantId: string;
}

export default function StaffDetailClient({ initialStaff, tenantId }: StaffDetailClientProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember>(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.push('/dashboard/staff');
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${staff.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        router.push('/dashboard/staff');
      } else {
        toast.error(data.message || 'Error al eliminar personal');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSaved = async () => {
    // Refresh staff data
    try {
      const response = await fetch(`/api/staff/${staff.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setStaff(data.staff);
      }
    } catch (error) {
      console.error('Error refreshing staff data:', error);
    }
    
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{staff.name}</h1>
            <p className="text-muted-foreground">{staff.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(staff.isActive)}
          <Button 
            variant="outline" 
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nombre completo
                  </label>
                  <div className="text-lg font-semibold text-foreground">{staff.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Posición
                  </label>
                  <div className="text-lg text-foreground">{staff.position}</div>
                </div>

                {staff.email && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </label>
                    <div className="text-foreground">{staff.email}</div>
                  </div>
                )}

                {staff.phone && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Teléfono
                    </label>
                    <div className="text-foreground">{staff.phone}</div>
                  </div>
                )}

                {staff.licenseNumber && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Número de licencia
                    </label>
                    <div className="text-foreground">{staff.licenseNumber}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Fecha de ingreso
                  </label>
                  <div className="text-foreground">{format(new Date(staff.createdAt), 'dd/MM/yyyy', { locale: es })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Citas</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{staff._count.appointments}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Historias</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{staff._count.medicalHistories}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Ventas</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{staff._count.Sale}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Órdenes médicas</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{staff._count.medicalOrders}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Assignments */}
      <div className="mt-6">
        <StaffLocationManager staffId={staff.id} tenantId={tenantId} />
      </div>

      {/* Edit Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode="edit"
        staff={staff}
        onStaffSaved={handleStaffSaved}
      />
    </div>
  );
} 