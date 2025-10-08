import SuperAdminManagement from '../../../components/admin/super-admins/SuperAdminManagement';
import { Suspense } from 'react';

export default function SuperAdminsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Super Administradores</h1>
      <Suspense fallback={<p>Cargando super administradores...</p>}>
        <SuperAdminManagement />
      </Suspense>
    </div>
  );
} 