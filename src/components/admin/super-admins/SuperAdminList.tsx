import AdminActions from './AdminActions';

interface SuperAdmin {
  id: string;
  email: string;
}

interface SuperAdminListProps {
  superAdmins: SuperAdmin[];
}

export default function SuperAdminList({ superAdmins }: SuperAdminListProps) {
  return (
    <div className="rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              ID de Usuario
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {superAdmins.map(admin => (
            <tr key={admin.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {admin.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <AdminActions userId={admin.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 