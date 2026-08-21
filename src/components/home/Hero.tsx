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
    <section className="relative bg-pros-black text-white overflow-hidden font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] lg:min-h-[640px]">
        
        {/* Left Column: Editorial Dark Text Block (Times New Roman UI) */}
        <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10 space-y-8 bg-pros-black">
          <div className="space-y-6 max-w-lg my-auto font-sans">
            {/* Small Eyebrow Label */}
            <div className="inline-block text-white/80 text-xs font-bold tracking-superwide uppercase font-sans">
              {currentSlide.eyebrow}
            </div>

            {/* Giant 3-Line Title */}
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none uppercase text-white">
              <span className="block">{currentSlide.titleLine1}</span>
              <span className="block text-white/95">{currentSlide.titleLine2}</span>
              <span className="block text-white/90">{currentSlide.titleLine3}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-semibold tracking-superwide uppercase text-white/70 font-sans">
              {currentSlide.subtitle}
            </p>

            {/* Primary High-Contrast White CTA Button */}
            <div className="pt-4">
              <Link
                to={currentSlide.ctaPath}
                className="inline-flex items-center gap-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs tracking-superwide uppercase px-8 py-4 rounded-none transition-all duration-300 transform hover:translate-x-1 shadow-xl font-sans"
              >
                <span>{currentSlide.ctaText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Interactive Slider Navigation Bar */}
          {activeSlides.length > 1 && (
            <div className="flex items-center gap-6 pt-6 border-t border-white/10 font-sans">
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

        {/* Right Column: Responsive CMS Photo (Desktop vs 390px Mobile) */}
        <div className="lg:col-span-7 relative min-h-[350px] lg:min-h-full bg-neutral-900">
          <picture className="w-full h-full">
            <source media="(max-width: 640px)" srcSet={currentSlide.mobileImageUrl || currentSlide.desktopImageUrl} />
            <img
              src={currentSlide.desktopImageUrl}
              alt={currentSlide.imageAlt}
              className="w-full h-full object-cover object-center transition-opacity duration-700"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-pros-black/60 via-transparent to-transparent lg:from-pros-black/80" />
        </div>
      </div>
    </section>
  );
};
