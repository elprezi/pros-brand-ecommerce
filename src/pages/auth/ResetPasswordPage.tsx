import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { resetPasswordSchema } from '../../lib/validation/auth';
import { calculatePasswordStrength } from '../../lib/utils/passwordStrength';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || 'client@pros.sn';
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Veuillez vérifier les mots de passe.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      resetPassword(emailParam, password);
      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/account');
      }, 1200);
    }, 600);
  };

  return (
    <AuthLayout
      title="RÉINITIALISATION DU MOT DE PASSE"
      subtitle="Choisissez un nouveau mot de passe sécurisé pour votre compte PROS."
    >
      {isSuccess ? (
        <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2 text-center font-sans">
          <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
          <h3 className="font-bold uppercase text-sm">MOT DE PASSE MODIFIÉ AVEC SUCCÈS !</h3>
          <p className="text-[11px] text-emerald-800">
            Votre session a été mise à jour. Redirection automatique vers votre espace client...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-pros-black">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-sans font-bold">
              <ShieldAlert size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* NOUVEAU MOT DE PASSE */}
          <div className="space-y-1 font-sans">
            <PasswordInput
              label="Nouveau mot de passe"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••••"
            />

            {/* STRENGTH INDICATOR */}
            {password && (
              <div className="space-y-1 pt-1 font-sans">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-neutral-500 uppercase">Sécurité :</span>
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

          {/* CONFIRMER LE MOT DE PASSE */}
          <div className="space-y-1 font-sans">
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center justify-center space-x-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50 font-sans"
          >
            <span>{isLoading ? 'TRAITEMENT...' : 'MODIFIER MON MOT DE PASSE'}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
