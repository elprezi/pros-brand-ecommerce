import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-white text-pros-black flex flex-col justify-between items-center p-4 sm:p-8 font-sans antialiased selection:bg-pros-sand selection:text-black">
      
      {/* HEADER SECTION (SECTION 13) */}
      <header className="w-full text-center pt-4 pb-6 space-y-2">
        <Link to="/" className="inline-block transition-transform hover:scale-105">
          <img
            src="/brand/LOGOPROS.png"
            alt="PROS"
            className="h-9 sm:h-10 max-h-10 max-w-[160px] w-auto object-contain mx-auto"
          />
        </Link>
        <div className="text-[11px] font-bold tracking-superwide uppercase text-pros-gold font-mono">
          ESPACE CLIENT PROS
        </div>
      </header>

      {/* CENTERED AUTHENTICATION CARD (DESKTOP MAX 540PX / RESPONSIVE MOBILE) */}
      <main className="w-full max-w-[540px] bg-pros-bone border border-neutral-200 p-6 sm:p-10 space-y-6 shadow-lg my-auto font-sans">
        <div className="text-center space-y-2 border-b border-neutral-200 pb-5">
          <h1 className="font-display font-black text-xl sm:text-2xl tracking-superwide uppercase text-pros-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-neutral-600 font-sans max-w-md mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </main>

      {/* FOOTER SECTION (SECTION 14) */}
      <footer className="w-full text-center py-6 border-t border-neutral-100 mt-8 space-y-2 font-mono text-[11px] text-neutral-500">
        <div>&copy; 2026 PROS — PRÉSIDENT OUSMANE SONKO</div>
        <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] uppercase font-bold text-neutral-400">
          <Link to="/about" className="hover:text-black transition-colors">
            Conditions d'utilisation
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-black transition-colors">
            Politique de confidentialité
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-black transition-colors">
            Aide & Support
          </Link>
        </div>
      </footer>

    </div>
  );
};
