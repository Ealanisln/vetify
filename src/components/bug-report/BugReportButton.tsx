'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group"
        aria-label="Reportar un error"
        title="Reportar un error"
      >
        <Bug className="h-5 w-5 transition-transform group-hover:rotate-12" />
      </button>
      <BugReportModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
