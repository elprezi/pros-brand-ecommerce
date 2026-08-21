import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../store/storeContext';

export const WhatsAppWidget: React.FC = () => {
  const { settings } = useStore();

  const cleanNumber = settings.whatsAppNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent("Bonjour Service Client PROS, je souhaite obtenir des informations sur la marque et vos pièces.");
  const whatsAppUrl = `https://wa.me/${cleanNumber}?text=${message}`;

  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-[#25D366] text-black font-bold p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Contactez-nous sur WhatsApp"
      title="Service Client PROS sur WhatsApp"
    >
      <MessageCircle size={24} className="fill-black text-transparent" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs tracking-wider uppercase font-semibold pl-0 group-hover:pl-2">
        WHATSAPP PROS
      </span>
    </a>
  );
};
