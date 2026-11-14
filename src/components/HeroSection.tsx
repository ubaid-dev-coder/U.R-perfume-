import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Droplet } from 'lucide-react';

interface HeroSectionProps {
  onShopNow: () => void;
  onExploreCollection: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopNow,
  onExploreCollection,
}) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/luxury_perfume_hero_banner_1794389834138.jpg"
          alt="U.R PERFUMES fragrance collection"
          className="w-full h-full object-cover object-center brightness-60 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/35" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
        <p className="text-[11px] sm:text-xs font-cinzel font-semibold tracking-[0.26em] text-[#d4af37] uppercase">
          Extrait de Parfum · 30ml Editions
        </p>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] text-balance">
            Discover Your <span className="text-[#d4af37]">Signature Scent</span>
          </h1>
          <p className="font-serif-luxury text-lg sm:text-2xl text-zinc-300 italic max-w-2xl mx-auto leading-relaxed">
            Concentrated fragrances crafted for everyday wear and special occasions.
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
            Blended with high-grade French and Oriental perfume oils in compact 30ml glass bottles, delivered nationwide across Pakistan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={onShopNow}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-[0.18em] rounded-md active:scale-[0.99] transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onExploreCollection}
            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-white font-cinzel font-semibold text-xs uppercase tracking-[0.18em] rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Explore Collection</span>
          </button>
        </div>

        <div className="pt-8 border-t border-zinc-800/80 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="flex items-center justify-center gap-2">
            <Truck className="w-4 h-4 text-[#d4af37]" />
            <span>Cash on Delivery Nationwide</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>High-Concentration Oils</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Droplet className="w-4 h-4 text-[#d4af37]" />
            <span>30ml Travel Glass Bottles</span>
          </div>
        </div>
      </div>
    </section>
  );
};
