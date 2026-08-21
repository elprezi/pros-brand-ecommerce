import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { loginSchema } from '../../lib/validation/auth';
import { Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Veuillez vérifier vos identifiants.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);

      if (res.success && res.user) {
        const userRole = res.user.role;
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF') {
          navigate(redirectPath.includes('/admin') ? redirectPath : '/admin');
        } else {
          navigate(redirectPath.includes('/admin') ? '/account' : redirectPath);
        }
      } else {
        setError(res.message || 'Email ou mot de passe incorrect.');
      }
    }, 500);
  };

  return (
    <AuthLayout
      title="CONNEXION À VOTRE COMPTE PROS"
      subtitle="Accédez à votre espace personnel, vos commandes et vos avantages PROS Club."
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-pros-black">
        
        {/* CLEAN ERROR NOTICE */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-sans font-bold">
            <ShieldAlert size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* EMAIL INPUT */}
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
              autoComplete="email"
            />
          </div>
        </div>

        {/* PASSWORD INPUT WITH SHOW/HIDE EYE TOGGLE */}
        <div className="space-y-1 font-sans">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold uppercase tracking-wider text-black text-[11px]">Mot de passe *</span>
            <Link
              to="/auth/forgot-password"
              className="text-[11px] text-neutral-600 hover:text-black underline font-sans font-bold"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
          />
        </div>

        {/* PRIMARY LOGIN BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50 font-sans"
        >
          <span>{isLoading ? 'SE CONNECTER...' : 'SE CONNECTER'}</span>
          {!isLoading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* SEPARATOR */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-neutral-300 w-full"></div>
        <span className="bg-pros-bone px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 shrink-0">
          OU
        </span>
        <div className="border-t border-neutral-300 w-full"></div>
      </div>

      {/* GOOGLE OAUTH BUTTON */}
      <GoogleOAuthButton mode="login" redirectUrl={redirectPath} />

      {/* REGISTER CTA LINK */}
      <div className="text-center pt-4 border-t border-neutral-200 mt-6 font-sans">
        <p className="text-xs text-neutral-600 font-sans">Vous n'avez pas encore de compte ?</p>
        <Link
          to="/auth/register"
          className="mt-2 inline-block py-2.5 px-6 border border-neutral-300 hover:border-black bg-white text-black font-bold text-xs uppercase tracking-wider transition-all shadow-sm font-sans"
        >
          CRÉER UN COMPTE
        </Link>
      </div>
    </AuthLayout>
  );
};
