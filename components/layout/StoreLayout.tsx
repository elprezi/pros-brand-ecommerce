import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface StoreLayoutProps {
  children: React.ReactNode;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-pros-black text-pros-bone flex flex-col font-sans selection:bg-pros-sand selection:text-black">
      <Header />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
};
