import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            ref={ref}
            className={`w-4 h-4 rounded-none bg-black border border-white/30 checked:bg-pros-sand checked:border-pros-sand text-black focus:ring-0 focus:ring-offset-0 cursor-pointer ${
              className || ''
            }`}
            {...props}
          />
          {label && <span className="text-xs text-white/80 select-none">{label}</span>}
        </label>
        {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
