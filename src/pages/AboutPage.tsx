import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-pros-black text-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Top Title Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">À PROPOS DE LA MARQUE</span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-ultra">
            PLUS QU'UN NOM, UNE VISION.
          </h1>
          <p className="text-xs sm:text-sm text-white/70 uppercase tracking-widest leading-relaxed">
            PROS — PRÉSIDENT OUSMANE SONKO est une marque de mode internationale et engagée née au Sénégal pour célébrer l’élégance, la force et la fierté contemporaine.
          </p>
        </div>

        {/* Hero Banner Image */}
        <div className="relative h-[480px] w-full bg-pros-dark overflow-hidden border border-white/10">
          <img
            src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1600&q=90"
            alt="PROS Brand Manifesto Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pros-black via-transparent to-black/60 flex items-end p-8 sm:p-12">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">MANIFESTE OFFICIEL</span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-white">
                ÉLÉGANCE. FORCE. ENGAGEMENT.
              </h2>
            </div>
          </div>
        </div>

        {/* 3 Pillars Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-pros-dark p-8 border border-white/10 space-y-4">
            <Compass size={32} className="text-pros-sand" />
            <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">
              NOTRE IDENTITÉ
            </h3>
            <p className="text-xs text-white/70 leading-relaxed uppercase tracking-wider">
              PROS représente une identité forte et contemporaine. Une marque qui refuse les compromis sur la qualité et s’impose comme une référence du streetwear de luxe continental.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-pros-dark p-8 border border-white/10 space-y-4">
            <Sparkles size={32} className="text-pros-sand" />
            <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">
              NOTRE VISION
            </h3>
            <p className="text-xs text-white/70 leading-relaxed uppercase tracking-wider">
              Créer une maison de mode capable de représenter une nouvelle génération d’Africains et de passionnés de mode à travers le monde. Transmettre le leadership et l’excellence.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-pros-dark p-8 border border-white/10 space-y-4">
            <Award size={32} className="text-pros-sand" />
            <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">
              NOTRE STYLE
            </h3>
            <p className="text-xs text-white/70 leading-relaxed uppercase tracking-wider">
              Minimalisme, confort absolu, matières lourdes (480GSM) et finitions irréprochables. Des coupes oversize pensées pour la prestance et le mouvement.
            </p>
          </div>
        </div>

        {/* Story Narrative */}
        <div className="bg-pros-dark border border-white/10 p-8 sm:p-12 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">CONFECTION & HAUTE EXIGENCE</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase mt-1">L'EXCELLENCE EN CHAQUE DÉTAIL</h2>
          </div>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed tracking-wider uppercase">
            Tous les textiles de la maison PROS sont rigoureusement sélectionnés auprès des meilleurs ateliers de filature. Nos molletonnages en coton biologique lourd (jusqu'à 480 grammes par mètre carré) garantissent une tenue parfaite lavage après lavage. Chaque broderie, chaque bouton gravé et chaque étiquette tissée témoigne d’un savoir-faire sans équivalent.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link to="/shop" className="btn-pros-primary py-4 px-8 text-xs text-center">
              DÉCOUVRIR LE CATALOGUE
            </Link>
            <Link to="/lookbook" className="btn-pros-secondary py-4 px-8 text-xs text-center">
              EXPLORER LE LOOKBOOK 2026
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
