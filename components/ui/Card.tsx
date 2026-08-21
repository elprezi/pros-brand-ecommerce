import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-neutral-900/80 border border-white/10 p-6 shadow-2xl backdrop-blur-md ${className || ''}`}>
      {children}
    </div>
  );
};
