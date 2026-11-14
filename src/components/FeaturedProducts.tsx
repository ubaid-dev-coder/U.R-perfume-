import React, { useState } from 'react';
import { Product, Store } from '../types';
import { ProductCard } from './ProductCard';
import { Clock, Truck } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface FeaturedProductsProps {
  products: Product[];
  selectedStore?: Store | null;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  selectedStore,
  onSelectProduct,
  onBuyNow,
}) => {
  const [filter, setFilter] = useState<'all' | 'bestsellers' | 'men' | 'women' | 'unisex'>('all');

  const activeProducts = products
    .filter((p) => (p.status || 'Active') === 'Active')
    .slice()
    .sort((a, b) => {
      const extractTime = (item: Product) => {
        if (item.createdAt) return new Date(item.createdAt).getTime();
        const match = item.id.match(/\d{10,13}/);
        if (match) return Number(match[0]);
        return 0;
      };
      const timeA = extractTime(a);
      const timeB = extractTime(b);
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return 0;
    });

  const filtered = activeProducts.filter((p) => {
    if (filter === 'bestsellers') return p.isBestSeller;
    if (filter === 'men') return p.gender === 'Men';
    if (filter === 'women') return p.gender === 'Women';
    if (filter === 'unisex') return p.gender === 'Unisex';
    return true;
  });

  return (
    <section id="shop" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Editorial Left-Aligned Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
            {selectedStore ? `${selectedStore.name} · 30ml Extraits` : '30ml Extrait de Parfum Catalog'}
          </p>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Signature Fragrances
          </h2>
          <p className="text-sm text-zinc-400 font-sans leading-relaxed">
            Concentrated 30ml inspired scents crafted with high-grade imported oils for lasting daily wear.
          </p>
        </div>

        {/* Clean Category Filter Strip */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b0b0d] border border-zinc-800 p-1 rounded-md self-start lg:self-auto">
          {[
            { id: 'all', label: `All (${activeProducts.length})` },
            { id: 'bestsellers', label: 'Best Sellers' },
            { id: 'women', label: 'Women' },
            { id: 'men', label: 'Men' },
            { id: 'unisex', label: 'Oud & Unisex' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-lg bg-[#0b0b0d] border border-zinc-800 text-center space-y-2 max-w-xl mx-auto">
          <h3 className="font-cinzel text-lg font-bold text-white">No Fragrances Found</h3>
          <p className="text-xs text-zinc-400">
            {selectedStore
              ? `${selectedStore.name} currently has no matching fragrances in stock for this category.`
              : 'No matching active fragrances found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}

      {/* Understated Hairline Service Strip */}
      <div className="border-y border-zinc-800/80 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
          <div>
            <div className="font-cinzel font-semibold text-white text-sm">12–16 Hours Lasting</div>
            <p className="text-zinc-400 mt-0.5">25–30% pure perfume oil concentration</p>
          </div>
        </div>

        <div className="flex items-start gap-3 sm:border-x sm:border-zinc-800/80 sm:px-6">
          <Truck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
          <div>
            <div className="font-cinzel font-semibold text-white text-sm">Cash on Delivery</div>
            <p className="text-zinc-400 mt-0.5">Nationwide courier delivery in 2–4 working days</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
          <div>
            <div className="font-cinzel font-semibold text-white text-sm">Direct WhatsApp Support</div>
            <p className="font-mono text-zinc-300 mt-0.5">
              {selectedStore?.whatsapp || '+92 339 0108748'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
