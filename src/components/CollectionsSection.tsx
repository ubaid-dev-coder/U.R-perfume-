import React from 'react';
import { Product } from '../types';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { ArrowRight } from 'lucide-react';

interface CollectionsSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  products,
  onSelectProduct,
}) => {
  const collections = [
    {
      title: 'Floral & Sweet Gourmand',
      subtitle: 'White Gardenia, Pear Blossom & Roasted Espresso',
      description:
        'Soft floral petals paired with warm vanilla and roasted coffee accords tailored for daytime wear and evening outings.',
      productIds: ['gucci-flora-inspired', 'black-opium-inspired'],
    },
    {
      title: 'Fresh, Citrus & Woody',
      subtitle: 'Calabrian Bergamot, Marine Ambergris & Spices',
      description:
        'Crisp bergamot, bay leaf, and spiced vetiver blends built for office hours, warm weather, and daily confidence.',
      productIds: ['janan-sports-inspired', 'janan-spot-inspired', 'azzaro-wanted-inspired', 'invictus-inspired'],
    },
    {
      title: 'Oud & Oriental',
      subtitle: 'Smoky Cambodian Agarwood & Amber',
      description:
        'Rich agarwood, caramelized sugar, and resinous amber for winter nights, gatherings, and formal occasions.',
      productIds: ['amir-alud-inspired'],
    },
  ];

  const initialIds = [
    'gucci-flora-inspired',
    'black-opium-inspired',
    'janan-sports-inspired',
    'janan-spot-inspired',
    'amir-alud-inspired',
    'azzaro-wanted-inspired',
    'invictus-inspired',
  ];
  const customReleases = products.filter(
    (p) => !initialIds.includes(p.id) && (p.status || 'Active') === 'Active'
  );

  const allCollections = [...collections];
  if (customReleases.length > 0) {
    allCollections.push({
      title: 'Latest Arrivals',
      subtitle: 'Newly Added 30ml Editions',
      description: 'Our newest fragrances added to the U.R PERFUMES catalog.',
      productIds: customReleases.map((p) => p.id),
    });
  }

  return (
    <section id="collections" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
      <div className="space-y-2 max-w-2xl mb-12">
        <span className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
          Fragrance Families
        </span>
        <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Browse by Scent Profile
        </h2>
        <p className="text-sm text-zinc-400">
          Organized by scent character so you can easily pick your everyday or evening signature.
        </p>
      </div>

      <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
        {allCollections.map((col, idx) => {
          const colProducts = products.filter((p) => col.productIds.includes(p.id));

          return (
            <div key={idx} className="py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="space-y-3 lg:col-span-1">
                <div className="text-xs font-mono text-[#d4af37] tracking-widest uppercase">
                  0{idx + 1} / Collection
                </div>

                <h3 className="font-cinzel text-2xl font-bold text-white leading-snug">
                  {col.title}
                </h3>

                <p className="font-serif-luxury text-sm text-[#d4af37] italic">
                  {col.subtitle}
                </p>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {colProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="cursor-pointer group p-3.5 rounded-lg bg-[#0b0b0d] border border-zinc-800 hover:border-[#d4af37]/60 transition-colors flex items-center gap-4"
                  >
                    <div className="w-20 h-28 rounded-md bg-black border border-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden">
                      <PerfumeBottleVisual
                        product={p}
                        size="sm"
                        className="!h-full !p-1"
                        interactive={false}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">
                        {p.size} · {p.gender}
                      </div>
                      <h4 className="font-cinzel text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors truncate">
                        {p.name.replace(' Inspired – 30ml', '')}
                      </h4>
                      <div className="text-xs text-zinc-400 font-serif-luxury italic truncate">
                        Inspired by {p.inspiredBy}
                      </div>
                      <div className="text-sm font-serif-luxury font-bold text-[#d4af37] pt-0.5 tabular-nums">
                        Rs. {p.price.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 pt-0.5 group-hover:text-white">
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
