import React from 'react';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ label, className, ...props }, ref) => {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        ref={ref}
        className={`w-4 h-4 bg-black border border-white/30 checked:bg-pros-sand checked:border-pros-sand text-black focus:ring-0 cursor-pointer ${
          className || ''
        }`}
        {...props}
      />
      {label && <span className="text-xs text-white/80 select-none">{label}</span>}
    </label>
  );
});

Radio.displayName = 'Radio';
