import { requireAuth } from '../../../lib/auth';
import { getCustomers } from '../../../lib/customers';
import { CustomersList } from '../../../components/customers/CustomersList';
import { CustomerStats } from '../../../components/customers/CustomerStats';
import { Button } from '../../../components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function CustomersPage() {
  const { tenant } = await requireAuth();
  
  // Get customers with their pets
  const customers = await getCustomers(tenant.id);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestiona tus clientes y dueños de mascotas</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="inline-flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <CustomerStats customers={customers} />

      {/* Customers List */}
      <CustomersList customers={customers} />
    </div>
  );
} 