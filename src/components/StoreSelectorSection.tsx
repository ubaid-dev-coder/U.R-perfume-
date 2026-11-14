import React from 'react';
import { Product, StoreProductAssignment } from '../types';
import { useCart } from '../context/CartContext';
import { Store as StoreIcon, MapPin, Clock, Phone, Check } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface StoreSelectorSectionProps {
  products: Product[];
  storeProducts: StoreProductAssignment[];
}

export const StoreSelectorSection: React.FC<StoreSelectorSectionProps> = ({
  products,
  storeProducts,
}) => {
  const { activeStores, selectedStore, selectStore } = useCart();

  if (activeStores.length === 0) return null;

  const getStoreAvailableCount = (storeId: string) => {
    const activeProductIds = new Set(
      products.filter((p) => (p.status || 'Active') === 'Active').map((p) => p.id)
    );
    return storeProducts.filter(
      (sp) => sp.storeId === storeId && sp.isAvailable && activeProductIds.has(sp.productId)
    ).length;
  };

  // Single Active Store -> Clean Flagship Branch Strip
  if (activeStores.length === 1) {
    const store = activeStores[0];
    return (
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 -mb-10">
        <div className="p-4 sm:px-6 sm:py-4 rounded-lg bg-[#0b0b0d] border border-zinc-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-black shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4af37] shrink-0">
                <StoreIcon className="w-4.5 h-4.5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs sm:text-sm font-bold text-white tracking-wider">
                  {store.name}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  · Open Daily
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 mt-1">
                {store.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#d4af37]" />
                    <span>{store.address}</span>
                  </span>
                )}
                {store.openingHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#d4af37]" />
                    <span>{store.openingHours}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#25D366]/60 text-zinc-200 text-xs font-medium transition-colors shrink-0"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>WhatsApp Desk: {store.whatsapp}</span>
            </a>
          )}
        </div>
      </section>
    );
  }

  // Multiple Active Stores -> Interactive Branch Selector
  return (
    <section id="boutiques" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-12 -mb-8">
      <div className="p-6 sm:p-8 rounded-lg bg-[#0b0b0d] border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <p className="text-[10px] font-cinzel font-bold tracking-[0.22em] text-[#d4af37] uppercase">
              U.R PERFUMES Branches ({activeStores.length})
            </p>
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-1">
              Select Store Branch
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Choose a branch to view available fragrances, branch pricing, and direct WhatsApp ordering.
            </p>
          </div>

          {selectedStore && (
            <div className="text-xs text-zinc-400 font-mono shrink-0 border border-zinc-800 bg-black px-3 py-1.5 rounded-md">
              Selected: <strong className="text-[#d4af37]">{selectedStore.name}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStores.map((store) => {
            const isSelected = selectedStore?.id === store.id;
            const availableCount = getStoreAvailableCount(store.id);

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => selectStore(store.id)}
                className={`text-left p-4 sm:p-5 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-zinc-900/90 border-[#d4af37]'
                    : 'bg-black/60 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="space-y-2.5 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-black shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#d4af37] shrink-0">
                          <StoreIcon className="w-4.5 h-4.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-cinzel text-sm font-bold text-white truncate">
                          {store.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                          {store.isDefault && (
                            <span className="text-[#d4af37] font-medium">Flagship ·</span>
                          )}
                          <span className="font-mono text-zinc-400 tabular-nums">
                            {availableCount} scents in stock
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {store.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{store.address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 w-full">
                  {store.openingHours && (
                    <span className="flex items-center gap-1 truncate">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="truncate">{store.openingHours}</span>
                    </span>
                  )}
                  {(store.whatsapp || store.phone) && (
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{store.whatsapp || store.phone}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
