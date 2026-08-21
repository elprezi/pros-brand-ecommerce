import React, { useState } from 'react';
import {
  initiateGoogleOAuthRedirect,
  isGoogleClientIdConfigured,
  saveGoogleClientId,
  getGoogleOAuthRedirectUri,
} from '../../lib/server/googleAuth';
import { Key, ExternalLink, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GoogleOAuthButtonProps {
  mode?: 'login' | 'register';
  redirectUrl?: string;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  mode = 'login',
  redirectUrl = '/account',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectUri = getGoogleOAuthRedirectUri();

  const handleGoogleClick = () => {
    if (isGoogleClientIdConfigured()) {
      setIsLoading(true);
      initiateGoogleOAuthRedirect(redirectUrl);
    } else {
      setIsConfigModalOpen(true);
    }
  };

  const handleSaveAndConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = inputClientId.trim();
    if (!cleanId || cleanId.length < 15 || !cleanId.includes('.')) {
      setErrorMsg('Veuillez saisir un Client ID Google Cloud valide (ex: xxxx.apps.googleusercontent.com).');
      return;
    }

    saveGoogleClientId(cleanId);
    setIsConfigModalOpen(false);
    setIsLoading(true);

    initiateGoogleOAuthRedirect(redirectUrl, cleanId);
  };

  return (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleGoogleClick}
        className="w-full py-3 px-4 bg-white border border-neutral-300 hover:border-black text-pros-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-3 transition-all shadow-sm cursor-pointer disabled:opacity-50 font-sans"
      >
        {/* Google G Multi-color Icon */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          {isLoading
            ? 'CONNEXION AVEC GOOGLE...'
            : mode === 'register'
            ? "S'INSCRIRE AVEC GOOGLE"
            : 'CONTINUER AVEC GOOGLE'}
        </span>
      </button>

      {/* GOOGLE OAUTH CLIENT ID CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-left">
          <form onSubmit={handleSaveAndConnect} className="bg-white border border-neutral-300 max-w-lg w-full p-6 space-y-4 text-black font-sans shadow-2xl">
            
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-pros-gold" />
                  <h3 className="font-display font-bold text-sm uppercase text-black">
                    CONFIGURATION GOOGLE OAUTH CLIENT ID
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Google Cloud exige l'ID Client officiel de votre application pour autoriser la connexion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2 font-sans">
                <ShieldAlert size={16} className="shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-pros-bone border border-neutral-200 space-y-1.5 font-sans">
                <strong className="font-bold uppercase text-[10px] text-neutral-500 block">
                  URL DE REDIRECTION À AUTORISER SUR GOOGLE CLOUD :
                </strong>
                <code className="p-1.5 bg-white border border-neutral-300 font-mono text-[11px] text-black block truncate select-all">
                  {redirectUri}
                </code>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-black text-[11px] block">
                  Saisir votre Google OAuth Client ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 123456789-abcdefg.apps.googleusercontent.com"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-neutral-300 font-mono text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="text-[11px] text-neutral-600 space-y-1">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pros-gold font-bold underline flex items-center gap-1 hover:text-black"
                >
                  <span>Obtenir gratuitement un Client ID sur Google Cloud Console</span>
                  <ExternalLink size={12} />
                </a>
                <p className="text-neutral-500">
                  Ou ajoutez <code className="bg-neutral-100 px-1 py-0.5 text-black">VITE_GOOGLE_CLIENT_ID</code> dans le fichier <code className="bg-neutral-100 px-1 py-0.5 text-black">.env</code> à la racine du projet.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
              >
                ANNULER
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>ENREGISTRER & CONTINUER</span>
              </button>
            </div>

          </form>
        </div>
      )}
    </>
  );
};
