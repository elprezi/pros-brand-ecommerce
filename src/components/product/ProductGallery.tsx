import React, { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const displayImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80'];

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative aspect-[3/4] w-full bg-pros-black border border-white/10 overflow-hidden group">
        <img
          src={displayImages[selectedIndex]}
          alt={`${productName} view ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Fullscreen Trigger */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 bg-black/60 text-white p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          aria-label="Agrandir la photo"
        >
          <Maximize2 size={18} />
        </button>

        {/* Angle Badge */}
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-pros-sand border border-white/10 backdrop-blur-md">
          {selectedIndex === 0 ? 'VUE PORTÉE' : selectedIndex === 1 ? 'VUE PRODUIT' : 'DÉTAIL MATIÈRE'}
        </div>
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`aspect-[3/4] overflow-hidden bg-pros-black border transition-all ${
                selectedIndex === idx ? 'border-pros-sand ring-1 ring-pros-sand opacity-100' : 'border-white/10 opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
          >
            <X size={32} />
          </button>
          <div className="max-w-4xl max-h-[90vh] relative">
            <img
              src={displayImages[selectedIndex]}
              alt={productName}
              className="max-h-[85vh] w-auto object-contain mx-auto border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
