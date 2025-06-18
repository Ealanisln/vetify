import { requireAuth } from '@/lib/auth';
import { NewCustomerForm } from '@/components/customers/NewCustomerForm';

export default async function NewCustomerPage() {
  const { tenant } = await requireAuth();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
        <p className="text-gray-500">Registra un nuevo cliente y sus mascotas</p>
      </div>

      {/* Form */}
      <NewCustomerForm tenantId={tenant.id} />
    </div>
  );
} 