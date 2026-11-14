import React from 'react';
import { INITIAL_TESTIMONIALS } from '../data/initialData';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
      <div className="space-y-2 max-w-2xl mb-10">
        <span className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
          Customer Feedback
        </span>
        <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Verified Customer Reviews
        </h2>
        <p className="text-sm text-zinc-400">
          Recent feedback from customers across Karachi, Lahore, Islamabad, and Faisalabad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {INITIAL_TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-lg bg-[#0b0b0d] border border-zinc-800/90 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex gap-1 text-[#d4af37]">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#d4af37]" />
                ))}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                "{t.comment}"
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 space-y-0.5">
              <div className="font-cinzel font-bold text-xs text-white">{t.name}</div>
              <div className="text-[11px] text-zinc-500 font-sans">
                {t.city} · <span className="text-[#d4af37]/90">{t.purchasedProduct}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
