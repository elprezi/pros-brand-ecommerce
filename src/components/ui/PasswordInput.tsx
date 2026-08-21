import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: 'current-password' | 'new-password' | 'off' | string;
  error?: string;
  className?: string;
  inputClassName?: string;
  showLockIcon?: boolean;
  allowToggle?: boolean; // When false, eye button is hidden and password remains permanently masked
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '••••••••••••',
  name,
  id,
  disabled = false,
  required = false,
  autoComplete = 'current-password',
  error,
  className = '',
  inputClassName = '',
  showLockIcon = true,
  allowToggle = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    if (!allowToggle) return;
    setShowPassword((prev) => !prev);
  };

  const isTextVisible = allowToggle && showPassword;

  return (
    <div className={`space-y-1 font-sans ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="font-bold uppercase tracking-wider text-black text-[11px] block font-sans"
        >
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {showLockIcon && (
          <Lock
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none shrink-0"
            size={16}
          />
        )}

        <input
          type={isTextVisible ? 'text' : 'password'}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`w-full bg-white border border-neutral-300 ${
            showLockIcon ? 'pl-10' : 'pl-3.5'
          } ${allowToggle ? 'pr-11' : 'pr-4'} py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans font-mono ${
            error ? 'border-red-500 focus:border-red-600' : ''
          } ${disabled ? 'bg-neutral-100 cursor-not-allowed opacity-60' : ''} ${inputClassName}`}
        />

        {allowToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            tabIndex={0}
            aria-label={isTextVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={isTextVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black transition-colors focus:outline-none focus:text-black cursor-pointer rounded-sm"
          >
            {isTextVisible ? (
              <EyeOff size={16} className="text-pros-black shrink-0" />
            ) : (
              <Eye size={16} className="text-neutral-500 hover:text-black shrink-0" />
            )}
          </button>
        )}
      </div>

      {error && <span className="text-[10px] font-bold text-red-600 block">{error}</span>}
    </div>
  );
};
