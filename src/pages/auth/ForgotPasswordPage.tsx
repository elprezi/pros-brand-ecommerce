import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Mail, CheckCircle2, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // STRICT SECURITY RULE: DO NOT REVEAL IF EMAIL EXISTS OR NOT
      requestPasswordReset(email);
      setIsLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <AuthLayout
      title="MOT DE PASSE OUBLIÉ ?"
      subtitle="Entrez votre adresse email et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe."
    >
      {submitted ? (
        /* SUCCESS CONFIRMATION NOTICE (DOES NOT LEAK USER EXISTENCE) */
        <div className="space-y-5 font-sans">
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold uppercase">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>DEMANDE DE RÉINITIALISATION ENVOYÉE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Si un compte correspond à cette adresse email (<strong>{email}</strong>), un lien sécurisé de réinitialisation vous a été transmis. Veuillez consulter votre boîte de réception.
            </p>
          </div>

          <Link
            to="/auth/login"
            className="w-full py-3 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer font-sans"
          >
            <ArrowLeft size={16} />
            <span>RETOUR À LA CONNEXION</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-pros-black">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-sans font-bold">
              <ShieldAlert size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5 font-sans">
            <label className="font-bold uppercase tracking-wider text-black text-[11px]">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="email"
                required
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-3 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50 font-sans"
          >
            <span>{isLoading ? 'ENVOI EN COURS...' : 'ENVOYER LE LIEN'}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>

          <div className="text-center pt-3 font-sans">
            <Link to="/auth/login" className="text-xs text-neutral-600 hover:text-black font-bold uppercase flex items-center justify-center gap-1">
              <ArrowLeft size={14} />
              <span>RETOUR À LA CONNEXION</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
