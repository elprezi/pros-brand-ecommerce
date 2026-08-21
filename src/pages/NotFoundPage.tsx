import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-pros-black text-white flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-lg mx-auto">
        <div className="font-display font-extrabold text-8xl text-pros-sand tracking-ultra">
          404
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-white">
            CETTE PIÈCE N'EXISTE PAS ENCORE.
          </h1>
          <p className="text-xs text-white/60 uppercase tracking-widest leading-relaxed">
            La page ou la création que vous recherchez est introuvable ou a été déplacée dans notre atelier.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/shop"
            className="btn-pros-primary py-4 px-8 text-xs inline-flex items-center space-x-2 shadow-2xl"
          >
            <span>RETOURNER À LA COLLECTION</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
