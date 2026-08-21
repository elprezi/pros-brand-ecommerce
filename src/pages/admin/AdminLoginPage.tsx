import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { loginSchema } from '../../lib/validation/auth';
import { useAuth } from '../../store/authContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Saisie invalide.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const result = login(email, password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.message || 'Identifiants administrateur incorrects. Accès refusé.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col justify-center items-center p-6 relative font-sans">
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-3 font-sans">
        <img src="/brand/LOGOPROS.png" alt="PROS ADMIN" className="h-10 w-auto object-contain mx-auto invert brightness-200" />
        <span className="inline-block px-3 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 font-sans">
          PANNEAU D'ADMINISTRATION PROS
        </span>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-md bg-neutral-950 border border-white/10 p-8 space-y-6 shadow-2xl backdrop-blur-xl font-sans">
        <div className="text-center space-y-2 border-b border-white/10 pb-4 font-sans">
          <h1 className="font-display font-bold text-xl tracking-superwide uppercase text-white font-sans">
            CONNEXION ADMINISTRATEUR
          </h1>
          <p className="text-xs text-white/60 font-sans">
            Espace officiel réservé à la gestion de la marque PROS.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-sans flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-white/5 border border-white/10 space-y-1 font-sans text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-pros-gold uppercase">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>ACCÈS SÉCURISÉ ADMIN ACTIVÉ</span>
          </div>
          <div className="text-white/80 font-sans">
            Veuillez saisir vos identifiants d'administration.
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 font-sans">
          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-bold uppercase tracking-wider text-white">Adresse Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                type="email"
                placeholder="admin@pros.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black border border-white/20 pl-10 pr-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white font-sans"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1 font-sans">
            <label className="text-xs font-bold uppercase tracking-wider text-white block mb-1">Mot de passe *</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              inputClassName="bg-black text-white border-white/20 focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-superwide hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 font-sans"
          >
            <span>{isLoading ? 'VÉRIFICATION EN COURS...' : 'SE CONNECTER À L’ADMINISTRATION'}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-white/40 uppercase tracking-widest font-sans">
        &copy; 2026 PROS — PRÉSIDENT OUSMANE SONKO
      </div>
    </div>
  );
};
