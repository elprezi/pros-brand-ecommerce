export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Faible' | 'Moyen' | 'Sécurisé';
  color: string;
  percentage: number;
}

export function calculatePasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) return { score: 0, label: 'Faible', color: 'bg-neutral-200', percentage: 0 };
  
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500', percentage: 33 };
  if (score <= 3) return { score, label: 'Moyen', color: 'bg-amber-500', percentage: 66 };
  return { score, label: 'Sécurisé', color: 'bg-emerald-600', percentage: 100 };
}
