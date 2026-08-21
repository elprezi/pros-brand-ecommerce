import React from 'react';
import { Truck, ShieldCheck, Award, RotateCcw, Headphones } from 'lucide-react';
import { useCms } from '../../store/cmsContext';

export const ServicesBenefitsBar: React.FC = () => {
  const { publishedCms } = useCms();
  const activeAdvantages = publishedCms.advantages.filter((a) => a.status === 'ACTIVE');

  if (activeAdvantages.length === 0) {
    return null;
  }

  const iconMap: Record<string, any> = {
    Truck,
    ShieldCheck,
    Award,
    RotateCcw,
    Headphones,
  };

  return (
    <section className="bg-[#F7F6F2] py-8 border-y border-neutral-200 text-black font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left font-sans">
          {activeAdvantages.map((adv) => {
            const Icon = iconMap[adv.iconName] || Truck;
            return (
              <div key={adv.id} className="flex flex-col md:flex-row items-center gap-3 p-2 font-sans">
                <div className="p-2.5 bg-pros-black text-white rounded-none shrink-0">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-superwide uppercase text-black font-sans">
                    {adv.title}
                  </h3>
                  <p className="text-[11px] font-medium text-neutral-600 font-sans">
                    {adv.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
