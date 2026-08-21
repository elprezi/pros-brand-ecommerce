import React from 'react';
import { Link } from 'react-router-dom';

export const BrandManifesto: React.FC = () => {
  return (
    <section className="relative py-32 bg-pros-black text-white overflow-hidden border-t border-white/10 flex items-center justify-center">
      {/* Background Graphic Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <span className="font-display font-extrabold text-[28vw] tracking-ultra uppercase text-white">
          PROS
        </span>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-12">
        {/* Sub-header */}
        <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 text-pros-sand text-[10px] font-bold tracking-superwide uppercase">
          MANIFESTO — PROS
        </div>

        {/* Big Animated Kinetic Text */}
        <div className="space-y-6 font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-ultra uppercase">
          <div className="text-white hover:text-pros-sand transition-colors duration-300">
            ÉLÉGANTE.
          </div>
          <div className="text-pros-sand hover:text-white transition-colors duration-300">
            FORTE.
          </div>
          <div className="text-white hover:text-pros-sand transition-colors duration-300">
            ENGAGÉE.
          </div>
        </div>

        {/* Divider line */}
        <div className="w-24 h-[1px] bg-pros-sand/60 mx-auto" />

        {/* Manifesto Paragraph */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-sm md:text-base font-bold uppercase tracking-wider text-pros-sand">
            PLUS QU'UN NOM, UNE VISION.
          </p>
          <p className="text-xs md:text-sm text-white/70 leading-relaxed uppercase tracking-wider">
            PROS n'est pas simplement une marque de vêtements. PROS est le symbole d’une nouvelle ère africaine contemporaine, où la souveraineté, la dignité et l’élégance se traduisent dans chaque fibre textiles de haute couture.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Link
            to="/about"
            className="btn-pros-secondary py-4 px-10 text-xs"
          >
            LIRE LE MANIFESTE COMPLET
          </Link>
        </div>
      </div>
    </section>
  );
};
