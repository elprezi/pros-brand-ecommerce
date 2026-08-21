import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md bg-neutral-950 border border-white/10 p-8 space-y-4 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-pros-sand font-mono">404</h1>
        <h2 className="text-sm font-bold tracking-superwide uppercase text-white">PAGE INTROUVABLE</h2>
        <p className="text-xs text-white/60">La page que vous recherchez n'existe pas ou a été déplacée.</p>
      </div>
    </div>
  );
}
