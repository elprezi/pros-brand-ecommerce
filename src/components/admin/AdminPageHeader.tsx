import React from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  eyebrow = 'ADMINISTRATION PROS',
  title,
  description,
  primaryAction,
  secondaryActions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4 font-sans">
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-[10px] font-bold tracking-superwide uppercase text-pros-gold block">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-superwide uppercase text-pros-black leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primaryAction || secondaryActions) && (
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
};
