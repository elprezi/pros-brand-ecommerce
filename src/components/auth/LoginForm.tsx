import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { PasswordInput } from '../ui/PasswordInput';
import { loginSchema, type LoginInput } from '../../lib/validation/auth';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (formData.email === 'admin@pros-official.sn' && formData.password === 'Admin1234') {
        localStorage.setItem('pros_user_role', 'ADMIN');
        localStorage.setItem('pros_user_name', 'Ousmane Sonko (Admin)');
        navigate('/admin');
      } else if (formData.email === 'staff@pros-official.sn' && formData.password === 'Staff1234') {
        localStorage.setItem('pros_user_role', 'STAFF');
        localStorage.setItem('pros_user_name', 'Agent Staff PROS');
        navigate('/admin');
      } else if (formData.email === 'client@pros-official.sn' && formData.password === 'Client1234') {
        localStorage.setItem('pros_user_role', 'CUSTOMER');
        localStorage.setItem('pros_user_name', 'Client Démo PROS');
        navigate('/account');
      } else {
        setServerError('Identifiants incorrects. Veuillez vérifier votre adresse email et mot de passe.');
      }
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Adresse Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nom@exemple.sn"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Mot de passe</Label>
          <Link to="/auth/forgot-password" className="text-[11px] text-pros-sand hover:underline font-mono">
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••••••"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
        SE CONNECTER
      </Button>

      <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
        Pas encore de compte ?{' '}
        <Link to="/auth/register" className="text-pros-sand hover:underline font-bold">
          Créer un compte
        </Link>
      </div>
    </form>
  );
};
