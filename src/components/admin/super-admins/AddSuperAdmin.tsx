'use client';

import { assignSuperAdminAction } from '../../../app/admin/super-admins/actions';

export default function AddSuperAdmin() {
  const handleAdd = async () => {
    const email = prompt('Ingresa el email del nuevo super administrador:');
    if (email) {
      try {
        await assignSuperAdminAction(email);
        alert('Super administrador agregado con éxito');
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
    <button onClick={handleAdd} className="btn-primary">
      Añadir Super Administrador
    </button>
  );
} 