import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <select
          ref={ref}
          className={`w-full bg-black border border-white/20 px-4 py-3 text-xs text-white focus:outline-none focus:border-pros-sand transition-colors font-mono cursor-pointer ${
            error ? 'border-red-500' : ''
          } ${className || ''}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
