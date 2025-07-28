'use client';

import { removeSuperAdminAction } from '@/app/admin/super-admins/actions';

interface AdminActionsProps {
  userId: string;
}

export default function AdminActions({ userId }: AdminActionsProps) {
  const handleRemove = async () => {
    if (confirm('¿Estás seguro de que quieres remover a este super administrador?')) {
      try {
        await removeSuperAdminAction(userId);
        alert('Super administrador removido con éxito');
      } catch (error) {
        if (error instanceof Error) {
          alert(`Error: ${error.message}`);
        } else {
          alert('Ocurrió un error inesperado');
        }
      }
    }
  };

  return (
    <button onClick={handleRemove} className="text-red-600 hover:text-red-900">
      Remover
    </button>
  );
} 