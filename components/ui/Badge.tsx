import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'sand' | 'gold' | 'outline' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className }) => {
  const styles = {
    primary: 'bg-white text-black font-bold',
    sand: 'bg-pros-sand text-black font-bold',
    gold: 'bg-pros-gold text-black font-bold',
    outline: 'bg-white/10 text-white border border-white/20',
    danger: 'bg-red-950/80 text-red-300 border border-red-500/40 font-bold',
    success: 'bg-green-950/80 text-green-300 border border-green-500/40 font-bold',
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 text-[10px] tracking-superwide uppercase ${styles[variant]} ${
        className || ''
      }`}
    >
      {children}
    </span>
  );
};
