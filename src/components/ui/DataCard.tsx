import { ReactNode } from 'react';

interface DataCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DataCard({
  title,
  description,
  action,
  children,
  className = '',
  noPadding = false
}: DataCardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'card-content'}>
        {children}
      </div>
    </div>
  );
}
