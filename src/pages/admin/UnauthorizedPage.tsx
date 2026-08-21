import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-pros-black flex flex-col justify-center items-center p-6 font-sans text-center">
      <div className="w-full max-w-md bg-pros-bone border border-neutral-200 p-8 space-y-6 shadow-xl font-sans">
        <div className="w-16 h-16 bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2 font-sans">
          <span className="text-[10px] font-bold uppercase tracking-widest text-pros-gold font-mono block">SÉCURITÉ & RESTRICTION D'ACCÈS</span>
          <h1 className="font-display font-extrabold text-2xl tracking-superwide uppercase text-black">
            ACCÈS NON AUTORISÉ
          </h1>
          <p className="text-xs text-neutral-600 font-sans leading-relaxed">
            Vous ne disposez pas des permissions nécessaires pour accéder à cette section.
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-200 space-y-3 font-sans">
          <Link
            to="/account"
            className="w-full py-3 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm font-sans"
          >
            <ArrowLeft size={16} />
            <span>RETOURNER À MON COMPTE</span>
          </Link>

          <Link
            to="/admin/login"
            className="w-full py-2.5 px-4 bg-white border border-neutral-300 hover:border-black text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm font-sans"
          >
            <Lock size={14} />
            <span>CONNEXION ADMINISTRATEUR</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-mono">
        &copy; 2026 PROS — SÉCURITÉ ADMINISTRATIVE
      </div>
    </div>
  );
};
