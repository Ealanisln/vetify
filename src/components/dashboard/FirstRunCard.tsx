import Link from 'next/link';

/**
 * Day-0 guidance shown on the dashboard while the tenant has no pets.
 * Server-compatible: no client state.
 */
export function FirstRunCard() {
  return (
    <div
      className="bg-white dark:bg-gray-800 border border-[#d5e3df] dark:border-gray-700 rounded-lg shadow-sm p-5 md:p-6"
      data-testid="first-run-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <span className="text-3xl md:text-4xl" aria-hidden="true">🐾</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Registra tu primera mascota
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Con la primera mascota podrás abrir su expediente, agendar citas y llevar su historial.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <Link
            href="/dashboard/pets/new"
            className="inline-flex items-center justify-center rounded-md bg-[#75a99c] hover:bg-[#5b9788] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c]"
          >
            Registrar mascota
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="text-xs text-gray-600 dark:text-gray-400 underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200"
          >
            o empieza por registrar un cliente
          </Link>
        </div>
      </div>
    </div>
  );
}
