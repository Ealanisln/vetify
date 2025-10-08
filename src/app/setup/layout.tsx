import type { ReactNode } from 'react';

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center">
        {children}
      </body>
    </html>
  );
} 