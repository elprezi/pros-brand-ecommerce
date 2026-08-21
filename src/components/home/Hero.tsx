import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCms } from '../../store/cmsContext';

export const Hero: React.FC = () => {
  const { publishedCms, mediaLibrary } = useCms();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Filter active & valid CMS slides (Exclude any slide whose media is missing)
  const activeSlides = publishedCms.hero.filter((s) => {
    if (s.status !== 'ACTIVE') return false;
    if (s.desktopMediaId) {
      return mediaLibrary.some((m) => m.id === s.desktopMediaId);
    }
    return !!s.desktopImageUrl && s.desktopImageUrl.trim().length > 0;
  });

  if (activeSlides.length === 0) {
    return null; // Graceful fallback
  }

  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0];

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative bg-pros-black text-white overflow-hidden font-sans min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] flex items-center">
      {/* Background Image Layer (Full width background on mobile & desktop) */}
      <div className="absolute inset-0 z-0">
        <picture className="w-full h-full">
          <source media="(max-width: 640px)" srcSet={currentSlide.mobileImageUrl || currentSlide.desktopImageUrl} />
          <img
            src={currentSlide.desktopImageUrl}
            alt={currentSlide.imageAlt}
            className="w-full h-full object-cover object-center opacity-40 lg:opacity-75 transition-opacity duration-700"
          />
        </picture>
        {/* Responsive Overlay Gradients for Perfect Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-pros-black via-pros-black/70 to-pros-black/40 lg:bg-gradient-to-r lg:from-pros-black lg:via-pros-black/80 lg:to-transparent" />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 lg:py-20 font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          
          {/* Text Block */}
          <div className="lg:col-span-7 space-y-6 max-w-xl font-sans">
            {/* Small Eyebrow Label */}
            <div className="inline-block text-pros-gold font-mono text-xs font-bold tracking-superwide uppercase">
              {currentSlide.eyebrow}
            </div>

            {/* Giant 3-Line Title */}
            <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-none uppercase text-white drop-shadow-md">
              <span className="block">{currentSlide.titleLine1}</span>
              <span className="block text-white/95">{currentSlide.titleLine2}</span>
              <span className="block text-white/90">{currentSlide.titleLine3}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-semibold tracking-superwide uppercase text-neutral-300 font-sans max-w-md">
              {currentSlide.subtitle}
            </p>

            {/* Primary CTA Button */}
            <div className="pt-2">
              <Link
                to={currentSlide.ctaPath}
                className="inline-flex items-center gap-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs tracking-superwide uppercase px-8 py-4 rounded-none transition-all duration-300 transform hover:translate-x-1 shadow-2xl font-sans"
              >
                <span>{currentSlide.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Interactive Slider Navigation Bar */}
            {activeSlides.length > 1 && (
              <div className="flex items-center gap-6 pt-6 border-t border-white/15 font-sans mt-8">
                <button
                  onClick={handlePrevSlide}
                  className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                  aria-label="Slide précédente"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-white font-bold">{String(currentSlideIndex + 1).padStart(2, '0')}</span>
                  
                  {/* Progress Line */}
                  <div className="w-24 sm:w-32 h-[2px] bg-white/20 relative overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${((currentSlideIndex + 1) / activeSlides.length) * 100}%` }}
                    />
                  </div>

                  <span className="text-white/40">{String(activeSlides.length).padStart(2, '0')}</span>
                </div>

                <button
                  onClick={handleNextSlide}
                  className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                  aria-label="Slide suivante"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
