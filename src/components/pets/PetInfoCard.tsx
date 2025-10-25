import { Pet, Customer } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getThemeClasses } from '../../utils/theme-colors';

type PetWithOwner = Pet & { customer: Customer };

interface PetInfoCardProps {
  pet: PetWithOwner;
}

export function PetInfoCard({ pet }: PetInfoCardProps) {
  // Safely convert weight to number (handles both Decimal and number types)
  const weightValue = pet.weight ? Number(pet.weight) : null;

  const infoItems = [
    { label: 'ID Interno', value: pet.internalId || 'No asignado' },
    { label: 'Fecha de nacimiento', value: format(pet.dateOfBirth, 'dd MMMM yyyy', { locale: es }) },
    { label: 'Peso', value: weightValue ? `${weightValue.toFixed(1)} ${pet.weightUnit}` : 'No registrado' },
    { label: 'Microchip', value: pet.microchipNumber || 'No tiene' },
    { label: 'Registrado', value: format(pet.createdAt, 'dd MMM yyyy', { locale: es }) },
  ];

  return (
    <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
      <h3 className={`text-base md:text-lg font-medium ${getThemeClasses('text.primary')} mb-4`}>
        Información General
      </h3>
      
      <dl className="grid grid-cols-1 gap-4">
        {infoItems.map((item, index) => (
          <div key={index} className={`border-b ${getThemeClasses('border.card')} pb-3 last:border-b-0`}>
            <dt className={`text-sm font-medium ${getThemeClasses('text.tertiary')}`}>{item.label}</dt>
            <dd className={`mt-1 text-sm ${getThemeClasses('text.primary')}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
      
      {/* Owner Info Section */}
      <div className={`mt-6 pt-6 border-t ${getThemeClasses('border.card')}`}>
        <h4 className={`text-sm font-medium ${getThemeClasses('text.primary')} mb-3`}>Información del Dueño</h4>
        <div className={`${getThemeClasses('background.muted')} rounded-lg p-4`}>
          <p className={`text-sm font-medium ${getThemeClasses('text.primary')}`}>
            {pet.customer?.name || 'Nombre no registrado'}
          </p>
          <p className={`text-sm ${getThemeClasses('text.secondary')}`}>{pet.customer?.email || 'Email no registrado'}</p>
          {pet.customer?.phone && (
            <p className={`text-sm ${getThemeClasses('text.secondary')}`}>📞 {pet.customer.phone}</p>
          )}
          {pet.customer?.address && (
            <p className={`text-sm ${getThemeClasses('text.secondary')}`}>📍 {pet.customer.address}</p>
          )}
        </div>
      </div>
    </div>
  );
} 