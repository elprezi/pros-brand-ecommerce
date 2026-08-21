import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { forgotPasswordSchema } from '../../lib/validation/auth';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 800);
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="p-4 bg-pros-sand/10 border border-pros-sand text-pros-sand text-xs font-mono uppercase tracking-wider">
          Un lien de réinitialisation sécurisé a été envoyé à <br />
          <strong className="text-white">{email}</strong>.
        </div>
        <p className="text-xs text-white/60">
          Veuillez vérifier votre boîte de réception et suivre les instructions envoyées par la Maison PROS.
        </p>
        <Link to="/auth/login" className="inline-block mt-4 text-xs font-bold text-white hover:underline uppercase tracking-widest">
          &larr; Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Adresse Email de votre compte</Label>
        <Input
          id="email"
          type="email"
          placeholder="nom@exemple.sn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
        ENVOYER LE LIEN DE RÉINITIALISATION
      </Button>

      <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
        <Link to="/auth/login" className="text-pros-sand hover:underline font-bold">
          &larr; Annuler et retourner à la connexion
        </Link>
      </div>
    </form>
  );
};
