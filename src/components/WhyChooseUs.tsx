import React from 'react';
import { Award, Clock, Truck, ShieldCheck } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const pillars = [
    {
      num: '01',
      icon: Award,
      title: 'High Oil Concentration',
      description:
        'Blended at 25–30% pure perfume oil extract for cleaner projection without harsh alcohol notes.',
    },
    {
      num: '02',
      icon: Clock,
      title: '12–16 Hours Lasting',
      description:
        'Balanced for warm Pakistani weather so top, heart, and wood bases hold well on skin and fabric.',
    },
    {
      num: '03',
      icon: Truck,
      title: 'Cash on Delivery Nationwide',
      description:
        'Pay the rider in cash at your doorstep across Karachi, Lahore, Islamabad, and cities nationwide.',
    },
    {
      num: '04',
      icon: ShieldCheck,
      title: 'Open Parcel Check',
      description:
        'Verify your parcel on arrival with responsive after-sales support directly through official WhatsApp.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
      <div className="space-y-2 max-w-2xl mb-10">
        <span className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
          Our Standard
        </span>
        <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Why Choose U.R PERFUMES
        </h2>
        <p className="text-sm text-zinc-400">
          Concentrated Extrait de Parfum formulations in practical 30ml bottles with transparent pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-800 rounded-lg bg-[#0b0b0d] divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 overflow-hidden">
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-[#d4af37]" />
                <span className="text-[11px] font-mono text-zinc-600">{item.num}</span>
              </div>
              <h3 className="font-cinzel text-base font-bold text-white">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
