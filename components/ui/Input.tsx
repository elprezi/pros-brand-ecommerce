import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-black border border-white/20 px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pros-sand transition-colors font-mono',
              error && 'border-red-500 focus:border-red-500',
              className
            )
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
