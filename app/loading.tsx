import React from 'react';
import { Spinner } from '../components/ui/Spinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col justify-center items-center p-6 space-y-4">
      <Spinner size="lg" />
      <p className="text-xs uppercase tracking-superwide text-pros-sand font-mono">CHARGEMENT MAISON PROS...</p>
    </div>
  );
}
