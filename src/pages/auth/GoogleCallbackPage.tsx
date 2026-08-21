import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseGoogleOAuthCallback } from '../../lib/server/googleAuth';
import { useAuth } from '../../store/authContext';
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const [statusMessage, setStatusMessage] = useState('Authentification Google en cours...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function handleGoogleCallback() {
      try {
        const result = await parseGoogleOAuthCallback();

        if (!isMounted) return;

        if (result.success && result.profile) {
          setStatusMessage('Création / Connexion de votre compte PROS...');

          // Authenticate / Auto-Create Client Account
          const authRes = loginWithGoogle({
            email: result.profile.email,
            firstName: result.profile.firstName,
            lastName: result.profile.lastName,
            avatar: result.profile.avatar,
            googleId: result.profile.googleId,
          });

          if (authRes.success && authRes.user) {
            setIsSuccess(true);
            const target = result.redirectTarget || (authRes.user.role === 'CLIENT' ? '/account' : '/admin');

            setTimeout(() => {
              navigate(target);
            }, 800);
          } else {
            setErrorMsg(authRes.message || 'Impossible de se connecter avec Google.');
            setTimeout(() => navigate('/auth/login'), 2500);
          }
        } else {
          setErrorMsg(result.error || 'Connexion Google annulée ou indisponible.');
          setTimeout(() => navigate('/auth/login'), 2500);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg('Impossible de se connecter avec Google. Veuillez réessayer.');
        setTimeout(() => navigate('/auth/login'), 2500);
      }
    }

    handleGoogleCallback();

    return () => {
      isMounted = false;
    };
  }, [loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-neutral-950 border border-white/10 p-8 space-y-6 text-center shadow-2xl font-sans">
        <img src="/brand/LOGOPROS.png" alt="PROS" className="h-8 w-auto mx-auto invert brightness-200" />

        {isSuccess ? (
          <div className="space-y-3 font-sans">
            <CheckCircle2 size={42} className="mx-auto text-emerald-400" />
            <h2 className="font-display font-bold text-base uppercase text-white">AUTHENTIFICATION GOOGLE RÉUSSIE</h2>
            <p className="text-xs text-white/70">Redirection vers votre espace client...</p>
          </div>
        ) : errorMsg ? (
          <div className="space-y-3 font-sans">
            <ShieldAlert size={42} className="mx-auto text-red-400" />
            <h2 className="font-display font-bold text-base uppercase text-red-400">ÉCHEC DE LA CONNEXION</h2>
            <p className="text-xs text-red-200">{errorMsg}</p>
            <span className="text-[10px] text-white/40 block font-mono">Redirection automatique vers la page de connexion...</span>
          </div>
        ) : (
          <div className="space-y-3 font-sans">
            <Loader2 size={36} className="mx-auto text-pros-gold animate-spin" />
            <h2 className="font-display font-bold text-sm uppercase text-white">{statusMessage}</h2>
            <p className="text-xs text-white/60">Veuillez patienter pendant la validation par Google...</p>
          </div>
        )}
      </div>
    </div>
  );
};
