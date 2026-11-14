import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { StoreService } from '../services/storeService';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { ShoppingBag, Star, Check } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onBuyNow,
}) => {
  const { addToCart, selectedStore } = useCart();
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onBuyNow(product);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = StoreService.generateProductWhatsAppUrl(product, 1, '', '', '', selectedStore);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const previewNotes = [
    product.topNotes[0] || 'Citrus',
    product.heartNotes[0] || 'Floral',
    product.baseNotes[0] || 'Amber',
  ].slice(0, 3);

  return (
    <div
      onClick={() => onSelect(product)}
      className="cursor-pointer group rounded-lg bg-[#0b0b0d] border border-zinc-800/90 hover:border-[#d4af37]/60 transition-colors overflow-hidden flex flex-col justify-between"
    >
      {/* Top Line */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between text-[11px] tracking-wider uppercase font-sans border-b border-zinc-900/80">
        <span className="text-zinc-400 font-medium">
          {product.size} · {product.gender}
        </span>

        {isOutOfStock ? (
          <span className="text-rose-400 font-medium">Out of Stock</span>
        ) : product.isBestSeller ? (
          <span className="text-[#d4af37] font-medium">Best Seller</span>
        ) : (
          <span className="text-zinc-500">In Stock</span>
        )}
      </div>

      {/* Bottle Showcase */}
      <div className="bg-[#0c0c0e] border-b border-zinc-900">
        <PerfumeBottleVisual
          product={product}
          size="md"
          className="w-full !h-64 sm:!h-72"
        />
      </div>

      {/* Details & Pricing */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] tracking-[0.2em] font-cinzel text-zinc-500 uppercase">
              U.R PERFUMES
            </span>
            <div className="flex items-center gap-1 text-[#d4af37]">
              <Star className="w-3 h-3 fill-[#d4af37]" />
              <span className="font-mono text-xs tabular-nums">{product.rating}</span>
            </div>
          </div>

          <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-[#d4af37] transition-colors leading-snug">
            {product.name}
          </h3>

          <div className="font-serif-luxury text-sm italic text-zinc-400">
            Inspired by {product.inspiredBy}
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-zinc-400 font-sans">
            <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Notes:</span>
            <span className="text-zinc-300 truncate">{previewNotes.join(' · ')}</span>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-serif-luxury text-2xl font-bold text-[#d4af37] tabular-nums">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-zinc-500 line-through tabular-nums font-mono">
                  Rs. {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.originalPrice > product.price && (
              <span className="text-[11px] font-medium text-emerald-400 tabular-nums">
                Save Rs. {(product.originalPrice - product.price).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="py-2.5 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNowClick}
              disabled={isOutOfStock}
              className="py-2.5 px-3 rounded-md bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>

          <button
            onClick={handleWhatsAppClick}
            className="w-full py-2 px-3 rounded-md bg-transparent hover:bg-zinc-900 border border-zinc-800 hover:border-[#25D366]/50 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>
              {selectedStore?.name
                ? `Order on ${selectedStore.name.replace('U.R PERFUMES – ', '')} WhatsApp`
                : 'Order via WhatsApp'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
