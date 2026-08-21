import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useStore } from '../../store/storeContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { cartCount, wishlistCount, setIsCartOpen, setIsSearchOpen, categories } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Dynamic Navigation Links from Categories in Store
  const navLinks = useMemo(() => {
    const activeCategories = categories
      .filter((c) => c.status === 'ACTIVE' && (c.showInMenu ?? true))
      .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1));

    const categoryLinks = activeCategories.map((cat) => ({
      name: cat.name,
      path: `/shop?category=${cat.slug.toLowerCase()}`,
    }));

    return [
      { name: 'ACCUEIL', path: '/' },
      ...categoryLinks,
      { name: 'COLLECTIONS', path: '/collections' },
      { name: 'À PROPOS', path: '/about' },
    ];
  }, [categories]);

  return (
    <header className="sticky top-0 z-40 bg-white text-pros-black border-b border-black/10 shadow-sm transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
        <div className="flex items-center justify-between h-16 sm:h-20 font-sans">
          
          {/* Left: Mobile Menu Trigger Button & Official LOGOPROS.png Logo */}
          <div className="flex items-center gap-4 font-sans">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-pros-black hover:text-neutral-600 transition-colors cursor-pointer"
              aria-label="Ouvrir le menu mobile"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center group py-1">
              <img
                src="/brand/LOGOPROS.png"
                alt="PROS — PRÉSIDENT OUSMANE SONKO"
                className="h-6 sm:h-8 max-h-8 max-w-[140px] sm:max-w-[160px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation (Light UI with Gold Accent) */}
          <nav className="hidden lg:flex items-center gap-8 font-sans">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/' && location.pathname === '/');
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-semibold tracking-superwide transition-all uppercase relative py-1 font-sans ${
                    isActive
                      ? 'text-pros-gold font-bold border-b-2 border-pros-gold'
                      : 'text-pros-black/80 hover:text-pros-gold'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-5 sm:gap-6 font-sans">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-pros-black hover:text-pros-gold transition-colors cursor-pointer"
              title="Rechercher"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>

            <Link
              to="/account"
              className="p-1.5 text-pros-black hover:text-pros-gold transition-colors"
              title="Mon Compte"
            >
              <User size={20} strokeWidth={1.8} />
            </Link>

            <Link
              to="/wishlist"
              className="p-1.5 text-pros-black hover:text-pros-gold transition-colors relative"
              title="Favoris"
            >
              <Heart size={20} strokeWidth={1.8} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pros-black text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1.5 text-pros-black hover:text-pros-gold transition-colors relative cursor-pointer"
              title="Panier"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pros-black text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white font-mono">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Light UI) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white backdrop-blur-xl flex flex-col justify-between p-6 lg:hidden animate-fade-in text-pros-black overflow-y-auto font-sans">
          <div>
            <div className="flex justify-between items-center pb-6 border-b border-black/10">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                <img
                  src="/brand/LOGOPROS.png"
                  alt="PROS"
                  className="h-7 w-auto max-h-8 max-w-[130px] object-contain"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X size={26} />
              </button>
            </div>

            <nav className="flex flex-col gap-6 mt-8 font-sans">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold tracking-superwide uppercase text-pros-black hover:text-pros-gold py-2 border-b border-black/5 font-sans"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-8 border-t border-black/10 space-y-4 font-sans">
            <Link
              to="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-xs font-bold tracking-wider text-pros-black uppercase font-sans"
            >
              MON ESPACE CLIENT PROS &rarr;
            </Link>
            <p className="text-[10px] text-black/50 uppercase tracking-widest font-mono">
              &copy; 2026 PROS — PRÉSIDENT OUSMANE SONKO
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
