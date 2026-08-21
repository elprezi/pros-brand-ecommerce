import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { PasswordInput } from '../ui/PasswordInput';
import { registerSchema, type RegisterInput } from '../../lib/validation/auth';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
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
      localStorage.setItem('pros_user_role', 'CUSTOMER');
      localStorage.setItem('pros_user_name', `${formData.firstName} ${formData.lastName}`);
      navigate('/account');
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            placeholder="Ousmane"
            value={formData.firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
            error={errors.firstName}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            placeholder="Sonko"
            value={formData.lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
            error={errors.lastName}
          />
        </div>
      </div>

      <div className="space-y-1">
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

      <div className="space-y-1">
        <Label htmlFor="phone">Téléphone (Sénégal)</Label>
        <Input
          id="phone"
          placeholder="+221 77 000 00 00"
          value={formData.phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
        />
      </div>

      <div className="space-y-1">
        <PasswordInput
          id="password"
          label="Mot de passe"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          autoComplete="new-password"
          placeholder="••••••••••••"
        />
      </div>

      <div className="space-y-1">
        <PasswordInput
          id="confirmPassword"
          label="Confirmer le mot de passe"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="••••••••••••"
        />
      </div>

      <Checkbox
        id="acceptTerms"
        checked={formData.acceptTerms}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, acceptTerms: e.target.checked })}
        label={
          <span>
            J'accepte les{' '}
            <span className="text-pros-sand underline">Conditions Générales de Vente</span> et la Politique de Confidentialité.
          </span>
        }
        error={errors.acceptTerms}
      />

      <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
        CRÉER MON COMPTE
      </Button>

      <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
        Déjà un compte ?{' '}
        <Link to="/auth/login" className="text-pros-sand hover:underline font-bold">
          Se connecter
        </Link>
      </div>
    </form>
  );
};
