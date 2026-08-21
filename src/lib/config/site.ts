export const siteConfig = {
  name: 'PROS — PRÉSIDENT OUSMANE SONKO',
  shortName: 'PROS',
  signature: 'PRÉSIDENT OUSMANE SONKO',
  slogan: 'ÉLÉGANCE. FORCE. ENGAGEMENT.',
  tagline: 'PLUS QU’UN NOM, UNE VISION.',
  description: 'Maison de mode & marque e-commerce officielle PROS - Président Ousmane Sonko.',
  url: typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SITE_URL
    ? import.meta.env.NEXT_PUBLIC_SITE_URL
    : typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'http://localhost:3000',
  currency: 'XOF',
  currencyDisplay: 'FCFA',
  defaultLocale: 'fr-FR',
  supportEmail: 'contact@pros-official.sn',
  supportPhone: '+221 77 000 00 00',
  whatsAppNumber: '+221 77 000 00 00',
  links: {
    instagram: 'https://instagram.com/pros_official',
    facebook: 'https://facebook.com/prosofficial',
    tiktok: 'https://tiktok.com/@pros_official',
  },
};
