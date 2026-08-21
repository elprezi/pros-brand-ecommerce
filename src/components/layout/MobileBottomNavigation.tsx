import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, User, ShoppingBag } from 'lucide-react';
import { useStore } from '../../store/storeContext';

export const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const { cartCount, wishlistCount, setIsCartOpen } = useStore();

  const items = [
    { label: 'ACCUEIL', path: '/', icon: Home },
    { label: 'CATÉGORIES', path: '/shop', icon: LayoutGrid },
    { label: 'FAVORIS', path: '/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'COMPTE', path: '/account', icon: User },
    { label: 'PANIER', path: '/cart', icon: ShoppingBag, badge: cartCount, isCartTrigger: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 py-2.5 px-3 lg:hidden shadow-2xl">
      <div className="flex justify-around items-center">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          if (item.isCartTrigger) {
            return (
              <button
                key={idx}
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center gap-1 text-black hover:text-black/60 transition-colors relative cursor-pointer"
              >
                <div className="relative">
                  <Icon size={18} strokeWidth={1.8} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[9px] font-bold tracking-wider uppercase text-black/80">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                isActive ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
              }`}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={1.8} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
