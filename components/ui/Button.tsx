import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold text-xs tracking-superwide uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none';

    const variants = {
      primary: 'bg-pros-black text-white hover:bg-pros-sand hover:text-black border border-transparent',
      secondary: 'bg-pros-bone text-black hover:bg-white border border-transparent',
      outline: 'bg-transparent text-white border border-white/30 hover:bg-white hover:text-black',
      ghost: 'bg-transparent text-white/80 hover:text-white hover:bg-white/10',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'px-4 py-2 text-[10px]',
      md: 'px-6 py-3.5 text-xs',
      lg: 'px-8 py-4 text-xs',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
