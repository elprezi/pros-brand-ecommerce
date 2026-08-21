import React from 'react';
import { X } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, category: _category }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-pros-dark border border-white/20 text-white max-w-2xl w-full p-6 md:p-8 relative shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white p-1"
        >
          <X size={24} />
        </button>

        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl uppercase tracking-wider text-pros-sand">
            GUIDE DES TAILLES — PROS
          </h3>
          <p className="text-xs text-white/70">
            Nos pièces sont conçues selon les standards du streetwear haut de gamme international. 
            Les hoodies et t-shirts adoptent une coupe oversize moderne.
          </p>

          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-pros-sand uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Taille</th>
                  <th className="py-3 px-3">Poitrine (cm)</th>
                  <th className="py-3 px-3">Longueur (cm)</th>
                  <th className="py-3 px-3">Manches (cm)</th>
                  <th className="py-3 px-3">Stature (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80 font-mono">
                <tr>
                  <td className="py-3 px-3 font-bold text-white">XS</td>
                  <td className="py-3 px-3">92 - 96</td>
                  <td className="py-3 px-3">68</td>
                  <td className="py-3 px-3">61</td>
                  <td className="py-3 px-3">160 - 168</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white">S</td>
                  <td className="py-3 px-3">96 - 102</td>
                  <td className="py-3 px-3">71</td>
                  <td className="py-3 px-3">63</td>
                  <td className="py-3 px-3">168 - 175</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white">M</td>
                  <td className="py-3 px-3">102 - 108</td>
                  <td className="py-3 px-3">74</td>
                  <td className="py-3 px-3">65</td>
                  <td className="py-3 px-3">175 - 182</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white">L</td>
                  <td className="py-3 px-3">108 - 114</td>
                  <td className="py-3 px-3">77</td>
                  <td className="py-3 px-3">67</td>
                  <td className="py-3 px-3">182 - 188</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white">XL</td>
                  <td className="py-3 px-3">114 - 122</td>
                  <td className="py-3 px-3">80</td>
                  <td className="py-3 px-3">69</td>
                  <td className="py-3 px-3">188 - 194</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-white">XXL</td>
                  <td className="py-3 px-3">122 - 130</td>
                  <td className="py-3 px-3">83</td>
                  <td className="py-3 px-3">71</td>
                  <td className="py-3 px-3">194+</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-white/50 space-y-1">
            <p>💡 <span className="text-white font-medium">Conseil de style :</span> Pour l’effet Oversize signature PROS, conservez votre taille habituelle.</p>
            <p>Besoin d’aide pour choisir votre taille ? Contactez-nous direct sur WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
