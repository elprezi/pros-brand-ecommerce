import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { registerSchema } from '../../lib/validation/auth';
import { calculatePasswordStrength } from '../../lib/utils/passwordStrength';
import { Mail, User, Phone, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Veuillez vérifier les informations saisies.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // STRICT SECURITY RULE: Public account registration ALWAYS creates role = 'CLIENT'
      const res = registerCustomer({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setIsLoading(false);

      if (res.success) {
        navigate('/account');
      } else {
        setError(res.message || 'Une erreur est survenue lors de la création du compte.');
      }
    }, 600);
  };

  return (
    <AuthLayout
      title="CRÉER VOTRE COMPTE PROS"
      subtitle="Rejoignez PROS et profitez d'une expérience personnalisée."
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-pros-black">
        
        {/* CLEAN ERROR NOTICE */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-sans font-bold">
            <ShieldAlert size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* PRÉNOM & NOM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 font-sans">
            <label className="font-bold uppercase tracking-wider text-black text-[11px]">Prénom</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                required
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-white border border-neutral-300 pl-10 pr-3 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>
          </div>

          <div className="space-y-1 font-sans">
            <label className="font-bold uppercase tracking-wider text-black text-[11px]">Nom</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                required
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-white border border-neutral-300 pl-10 pr-3 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>
          </div>
        </div>

        {/* ADRESSE EMAIL */}
        <div className="space-y-1 font-sans">
          <label className="font-bold uppercase tracking-wider text-black text-[11px]">Adresse Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="email"
              required
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              autoComplete="email"
            />
          </div>
        </div>

        {/* TÉLÉPHONE */}
        <div className="space-y-1 font-sans">
          <label className="font-bold uppercase tracking-wider text-black text-[11px]">Téléphone Mobile (Sénégal)</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="tel"
              required
              placeholder="+221 77 000 00 00"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans font-mono"
            />
          </div>
        </div>

        {/* MOT DE PASSE WITH INDEPENDENT SHOW/HIDE TOGGLE */}
        <div className="space-y-1 font-sans">
          <PasswordInput
            label="Mot de passe"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="new-password"
            placeholder="••••••••••••"
          />

          {/* PASSWORD STRENGTH INDICATOR */}
          {formData.password && (
            <div className="space-y-1 pt-1 font-sans">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-neutral-500 uppercase">Sécurité du mot de passe :</span>
                <span className={`uppercase font-mono ${
                  passwordStrength.label === 'Faible'
                    ? 'text-red-600'
                    : passwordStrength.label === 'Moyen'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  Mot de passe {passwordStrength.label.toLowerCase()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* CONFIRMER LE MOT DE PASSE WITH INDEPENDENT SHOW/HIDE TOGGLE */}
        <div className="space-y-1 font-sans">
          <PasswordInput
            label="Confirmer le mot de passe"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            autoComplete="new-password"
            placeholder="••••••••••••"
          />
        </div>

        {/* ACCEPT TERMS CHECKBOX */}
        <div className="pt-2 font-sans">
          <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-neutral-700 font-sans">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="mt-0.5 rounded-none accent-black cursor-pointer"
            />
            <span>
              J'accepte les conditions d'utilisation et la politique de confidentialité PROS.
            </span>
          </label>
        </div>

        {/* PRIMARY SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50 font-sans mt-3"
        >
          <span>{isLoading ? 'CRÉATION DU COMPTE...' : 'CRÉER MON COMPTE'}</span>
          {!isLoading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* SEPARATOR */}
      <div className="relative flex items-center justify-center my-5">
        <div className="border-t border-neutral-300 w-full"></div>
        <span className="bg-pros-bone px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 shrink-0">
          OU
        </span>
        <div className="border-t border-neutral-300 w-full"></div>
      </div>

      {/* GOOGLE SIGNUP OAUTH BUTTON */}
      <GoogleOAuthButton mode="register" redirectUrl="/account" />

      {/* LOGIN CTA LINK */}
      <div className="text-center pt-4 border-t border-neutral-200 mt-5 font-sans">
        <p className="text-xs text-neutral-600 font-sans">Vous avez déjà un compte ?</p>
        <Link
          to="/auth/login"
          className="mt-2 inline-block py-2.5 px-6 border border-neutral-300 hover:border-black bg-white text-black font-bold text-xs uppercase tracking-wider transition-all shadow-sm font-sans"
        >
          SE CONNECTER
        </Link>
      </div>
    </AuthLayout>
  );
};
