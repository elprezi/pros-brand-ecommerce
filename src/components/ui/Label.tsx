import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, children, ...props }) => {
  return (
    <label
      className={`block text-xs font-semibold uppercase tracking-wider text-white/80 ${className || ''}`}
      {...props}
    >
      {children}
    </label>
  );
};
