import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCms } from '../../store/cmsContext';
import { useStore } from '../../store/storeContext';

export const FeaturedCategories: React.FC = () => {
  const { publishedCms } = useCms();
  const { categories } = useStore();

  const activeCategories = useMemo(() => {
    const storeActive = categories
      .filter((c) => c.status === 'ACTIVE' && (c.showOnHomepage ?? true))
      .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1));

    if (storeActive.length > 0) {
      return storeActive.map((c) => ({
        id: c.id,
        title: c.name,
        ctaText: 'DÉCOUVRIR LA SELECTION',
        url: `/shop?category=${c.slug.toLowerCase()}`,
        imageUrl: c.imageUrl || 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
        imageAlt: c.name,
      }));
    }

    return publishedCms.categories
      .filter((c) => c.status === 'ACTIVE')
      .map((c) => ({
        id: c.id,
        title: c.title,
        ctaText: c.ctaText,
        url: c.url,
        imageUrl: c.desktopImageUrl,
        imageAlt: c.imageAlt,
      }));
  }, [categories, publishedCms]);

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-[#F7F6F2] text-black font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.url}
              className="group relative bg-[#EBE9E1] overflow-hidden p-8 flex justify-between items-center min-h-[220px] transition-transform duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl font-sans"
            >
              <div className="z-10 space-y-4 max-w-[55%]">
                <h2 className="font-display font-bold text-2xl tracking-superwide uppercase text-black">
                  {cat.title}
                </h2>
                <div className="inline-flex items-center gap-2 text-xs font-bold tracking-superwide uppercase text-black group-hover:text-pros-gold transition-colors font-sans">
                  <span>{cat.ctaText || 'DÉCOUVRIR'}</span>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="w-1/2 h-full absolute right-0 top-0 bottom-0 overflow-hidden">
                <img
                  src={cat.imageUrl}
                  alt={cat.imageAlt || cat.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
