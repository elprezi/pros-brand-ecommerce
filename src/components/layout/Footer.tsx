import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Share2, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-pros-black text-white border-t border-white/10 pt-16 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/">
              <img
                src="/brand/LOGOPROS.png"
                alt="PROS — PRÉSIDENT OUSMANE SONKO"
                className="h-7 sm:h-8 max-h-8 max-w-[140px] w-auto object-contain invert brightness-200"
              />
            </Link>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              La marque officielle incarnant l’élégance, la force et l’engagement de la jeunesse et du peuple sénégalais.
            </p>
            <div className="flex gap-4 text-white/70 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono">
                <Share2 size={16} /> <span>INSTAGRAM</span>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono">
                <Globe size={16} /> <span>FACEBOOK</span>
              </a>
            </div>
          </div>

          {/* Navigation Boutique */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-superwide text-white">BOUTIQUE OFFICIELLE</h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-sans uppercase">
              <li><Link to="/shop?category=homme" className="hover:text-white transition-colors">COLLECTION HOMME</Link></li>
              <li><Link to="/shop?category=femme" className="hover:text-white transition-colors">COLLECTION FEMME</Link></li>
              <li><Link to="/shop?category=accessoires" className="hover:text-white transition-colors">ACCESSOIRES PROS</Link></li>
              <li><Link to="/collections" className="hover:text-white transition-colors">ÉDITION LIMITÉE 2026</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-superwide text-white">SERVICE CLIENT</h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-sans uppercase">
              <li><Link to="/order-tracking" className="hover:text-white transition-colors">SUIVI DE COMMANDES</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">LIVRAISONS & RETOURS</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">FOIRE AUX QUESTIONS (FAQ)</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">ESPACE CLIENT</Link></li>
            </ul>
          </div>

          {/* Contact Senegal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-superwide text-white">MAISON PROS SÉNÉGAL</h4>
            <ul className="space-y-3 text-xs text-white/70 font-mono">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-white shrink-0" />
                <span>Almadies, Dakar — Sénégal</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-white shrink-0" />
                <span>+221 77 000 00 00 (WhatsApp)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-white shrink-0" />
                <span>contact@pros-official.sn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/50 font-mono gap-4 uppercase">
          <div>&copy; 2026 PROS — PRÉSIDENT OUSMANE SONKO. TOUS DROITS RÉSERVÉS.</div>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-white transition-colors">MENTIONS LÉGALES</Link>
            <Link to="/about" className="hover:text-white transition-colors">POLITIQUE DE CONFIDENTIALITÉ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
