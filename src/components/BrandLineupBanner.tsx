import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BrandLineupBannerProps {
  onShopNow: () => void;
  onExploreCollections: () => void;
}

const LINEUP_NAMES = [
  'Janan Spot',
  'Invictus',
  'Janan Gold',
  'Azzaro Wanted',
  'Gucci Flora',
  'Amir Ul Oud',
  'Black Opium',
];

export const BrandLineupBanner: React.FC<BrandLineupBannerProps> = ({
  onShopNow,
  onExploreCollections,
}) => {
  return (
    <section className="bg-[#060608] border-b border-zinc-800/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 space-y-5">
          <p className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
            U.R PERFUMES · Fragrance Beyond Time
          </p>

          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-white tracking-tight leading-[1.15]">
            Signature 30ml Extrait de Parfum Collection
          </h1>

          <p className="text-sm text-zinc-400 font-sans leading-relaxed max-w-xl">
            Concentrated, long-lasting fragrances crafted with imported perfume oils in travel-ready 30ml glass bottles, delivered Cash on Delivery across Pakistan.
          </p>

          {/* Clean Hairline Scent Directory */}
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2.5">
              Signature Lineup
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-zinc-300 font-sans">
              {LINEUP_NAMES.map((scent, index) => (
                <div key={scent} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#d4af37] tabular-nums">
                    0{index + 1}
                  </span>
                  <span>{scent}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onShopNow}
              className="px-6 py-3 rounded-md bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
            >
              <span>Shop Fragrances</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreCollections}
              className="px-5 py-3 rounded-md bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-medium text-xs uppercase tracking-wider transition-colors"
            >
              Scent Profiles
            </button>
          </div>
        </div>

        {/* Right Campaign Poster Plate */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div
            onClick={onShopNow}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onShopNow();
            }}
            title="Click to browse our 30ml fragrance collection"
            className="cursor-pointer group w-full max-w-[440px] rounded-lg bg-[#0d0d10] border border-zinc-800 hover:border-[#d4af37]/60 p-2 sm:p-2.5 transition-colors shadow-2xl"
          >
            <div className="bg-black rounded-md overflow-hidden">
              <img
                src="/assets/aistudio/image_09353f02.png"
                alt="U.R PERFUMES Fragrance Beyond Time - Janna Spot, Invictus, Azzaro Wanted, Gucci Flora, Amir Ul Oud, Black Opium"
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>

            <div className="pt-2.5 px-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">U.R PERFUMES · Fragrance Beyond Time</span>
              <span className="text-[#d4af37]">30ml · Nationwide COD</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
