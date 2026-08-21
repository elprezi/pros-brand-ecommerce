import React from 'react';
import { Button } from '../components/ui/Button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-pros-black text-white flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md bg-neutral-950 border border-white/10 p-8 space-y-4 shadow-2xl">
        <h2 className="text-lg font-bold tracking-superwide uppercase text-red-400">UNE ERREUR EST SURVENUE</h2>
        <p className="text-xs text-white/60 font-mono">{error.message || "Une erreur inattendue s'est produite sur la plateforme PROS."}</p>
        <Button variant="primary" onClick={() => reset()} className="w-full mt-4">
          RÉESSAYER
        </Button>
      </div>
    </div>
  );
}
