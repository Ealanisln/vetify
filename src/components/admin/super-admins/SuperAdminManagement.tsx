'use server';

import { listSuperAdmins } from '@/lib/super-admin';
import AddSuperAdmin from './AddSuperAdmin';
import SuperAdminList from './SuperAdminList';

export default async function SuperAdminManagement() {
  const superAdmins = await listSuperAdmins();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p>
          Actualmente hay <span className="font-bold">{superAdmins.length}</span> super
          administradores.
        </p>
        <AddSuperAdmin />
      </div>
      <SuperAdminList superAdmins={superAdmins} />
    </div>
  );
} 