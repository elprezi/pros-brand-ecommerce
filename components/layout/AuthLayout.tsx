import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col justify-center items-center p-6 relative">
      <div className="mb-8">
        <Link to="/">
          <img src="/brand/logo-pros-white.svg" alt="PROS" className="h-14 w-auto object-contain mx-auto" />
        </Link>
      </div>

      <div className="w-full max-w-md bg-neutral-950 border border-white/10 p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-xl tracking-superwide uppercase text-white">{title}</h1>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-white/40 uppercase tracking-widest">
        &copy; 2026 PROS — PRÉSIDENT OUSMANE SONKO
      </div>
    </div>
  );
};
