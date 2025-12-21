'use client';

import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CashDrawer {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openedAt: Date;
  initialAmount: number;
  openedBy: {
    name: string;
  };
  location?: {
    id: string;
    name: string;
  } | null;
}

interface CashDrawerSelectorProps {
  drawers: CashDrawer[];
  selectedDrawerId: string | null;
  onSelect: (drawerId: string) => void;
  disabled?: boolean;
}

export function CashDrawerSelector({
  drawers,
  selectedDrawerId,
  onSelect,
  disabled = false
}: CashDrawerSelectorProps) {
  // Don't render if no drawers or only one drawer (auto-selected)
  if (drawers.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <CurrencyDollarIcon className="h-5 w-5 text-muted-foreground" />
      <select
        value={selectedDrawerId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="form-select text-sm py-1.5 pr-8 min-w-[200px] border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-foreground"
      >
        {drawers.map((drawer) => (
          <option key={drawer.id} value={drawer.id}>
            {drawer.location?.name || 'Sin ubicación'} - {drawer.openedBy.name} ({format(new Date(drawer.openedAt), 'HH:mm', { locale: es })})
          </option>
        ))}
      </select>
    </div>
  );
}
