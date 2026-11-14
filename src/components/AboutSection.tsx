import React from 'react';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import { Compass, HeartHandshake } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column: Brand Story */}
        <div className="space-y-5">
          <p className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
            About Us
          </p>

          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Concentrated Scents in Compact <span className="text-[#d4af37]">30ml Bottles</span>
          </h2>

          <p className="font-serif-luxury text-lg text-zinc-300 italic leading-relaxed">
            "A fine fragrance leaves a lasting impression long after you leave the room."
          </p>

          <div className="space-y-3.5 text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
            <p>
              <strong className="text-white">U.R PERFUMES</strong> started in Karachi with a straightforward goal: bringing long-lasting, designer-inspired perfumes to customers across Pakistan at fair PKR prices.
            </p>
            <p>
              Instead of diluted sprays that fade quickly in humid weather, we blend concentrated <strong className="text-[#d4af37]">Extrait de Parfum</strong> oils in practical 30ml glass bottles you can easily carry anywhere — for office hours, travel, or evening events.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-cinzel font-semibold text-sm">
                <Compass className="w-4 h-4 text-[#d4af37]" />
                <span>High Oil Purity</span>
              </div>
              <p className="text-xs text-zinc-400">
                Close fidelity to iconic luxury scent profiles.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-cinzel font-semibold text-sm">
                <HeartHandshake className="w-4 h-4 text-[#d4af37]" />
                <span>Transparent Pricing</span>
              </div>
              <p className="text-xs text-zinc-400">
                Direct PKR rates with nationwide Cash on Delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Brand Crest & Specs */}
        <div className="bg-[#0b0b0d] border border-zinc-800 rounded-lg p-8 sm:p-10 text-center space-y-6">
          <div className="flex justify-center">
            <RoyalCrownLogo size="xl" iconOnly />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#d4af37] tracking-widest uppercase">
              KARACHI · PAKISTAN
            </span>
            <h3 className="font-cinzel text-2xl font-bold text-white">
              U.R PERFUMES
            </h3>
            <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto">
              Fragrance Beyond Time — everyday luxury oils bottled cleanly for travel and daily wear.
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-3 divide-x divide-zinc-800/80 text-center tabular-nums">
            <div className="px-2">
              <div className="font-serif-luxury text-xl font-bold text-[#d4af37]">30ml</div>
              <div className="text-[10px] text-zinc-500 uppercase font-sans mt-0.5">Bottle Size</div>
            </div>
            <div className="px-2">
              <div className="font-serif-luxury text-xl font-bold text-[#d4af37]">25–30%</div>
              <div className="text-[10px] text-zinc-500 uppercase font-sans mt-0.5">Oil Extract</div>
            </div>
            <div className="px-2">
              <div className="font-serif-luxury text-xl font-bold text-[#d4af37]">100%</div>
              <div className="text-[10px] text-zinc-500 uppercase font-sans mt-0.5">COD Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
