import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { StoreService } from '../services/storeService';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import {
  X,
  ShoppingBag,
  Star,
  Check,
  Clock,
  Wind,
  ArrowRight,
  ShieldCheck,
  Truck,
  Droplet,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ProductDetailsModalProps {
  product: Product | null;
  allProducts: Product[];
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
  onDirectCheckout: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  allProducts,
  onClose,
  onSelectProduct,
  onDirectCheckout,
}) => {
  const { addToCart, selectedStore, settings } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const activeWhatsapp = selectedStore?.whatsapp || settings.officialWhatsapp;

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    onDirectCheckout(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-[#0b0b0d] border border-zinc-800 rounded-lg shadow-2xl text-white overflow-hidden my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-white rounded-md bg-black/80 border border-zinc-800 hover:border-zinc-600 transition-colors"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[88vh] overflow-y-auto">
          {/* Left Column: Bottle Image & Specs */}
          <div className="p-6 sm:p-8 bg-[#09090b] flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800/80">
            <div className="w-full">
              <PerfumeBottleVisual
                product={product}
                size="detail"
                className="w-full"
              />
            </div>

            <div className="w-full mt-6 border-t border-zinc-800/80 pt-4 divide-y divide-zinc-800/60 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Longevity</span>
                </span>
                <span className="text-white font-medium text-right">{product.longevity}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Wind className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Projection</span>
                </span>
                <span className="text-white font-medium text-right">{product.sillage}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Droplet className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Concentration</span>
                </span>
                <span className="text-white font-medium text-right">25–30% Perfume Oil</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Specifications & Actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pr-8">
                <span className="text-[11px] font-cinzel font-semibold tracking-[0.2em] text-[#d4af37] uppercase">
                  U.R PERFUMES · {product.size.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-[#d4af37] text-xs tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-zinc-500">({product.reviewCount})</span>
                </div>
              </div>

              <div>
                <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  {product.name}
                </h1>
                <p className="text-sm text-[#d4af37] font-serif-luxury italic mt-1">
                  Inspired by {product.inspiredBy}
                </p>
                {selectedStore && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Branch: <span className="text-white font-medium">{selectedStore.name}</span>
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-3 pb-4 border-b border-zinc-800/80 flex-wrap tabular-nums">
                <span className="text-3xl font-serif-luxury font-bold text-[#d4af37]">
                  Rs. {product.price.toLocaleString()}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-zinc-500 line-through font-mono">
                      Rs. {product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-emerald-400">
                      Save Rs. {(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
                <span className="ml-auto text-xs text-zinc-400 font-mono">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                {product.description}
              </p>

              {/* Scent Notes Table */}
              <div className="border-y border-zinc-800/80 divide-y divide-zinc-800/60 text-xs">
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-20 shrink-0 font-cinzel font-semibold text-[#d4af37]">Top Notes</span>
                  <span className="text-zinc-300 font-sans">{product.topNotes.join(' · ')}</span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-20 shrink-0 font-cinzel font-semibold text-[#d4af37]">Heart Notes</span>
                  <span className="text-zinc-300 font-sans">{product.heartNotes.join(' · ')}</span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-20 shrink-0 font-cinzel font-semibold text-[#d4af37]">Base Notes</span>
                  <span className="text-zinc-300 font-sans">{product.baseNotes.join(' · ')}</span>
                </div>
              </div>

              {/* Quantity & Purchase */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-400">Quantity:</span>
                    <div className="flex items-center border border-zinc-700 rounded-md bg-black">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={isOutOfStock}
                        className="px-3 py-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold text-white tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                        disabled={isOutOfStock}
                        className="px-3 py-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-sm font-mono text-zinc-300 tabular-nums">
                    Total: <strong className="text-[#d4af37] font-serif-luxury text-lg">Rs. {(product.price * quantity).toLocaleString()}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 font-semibold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="py-3 px-4 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Buy Now (COD)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={StoreService.generateProductWhatsAppUrl(product, quantity, '', '', '', selectedStore)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#25D366]/60 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>Order via WhatsApp ({activeWhatsapp})</span>
                </a>
              </div>

              <div className="pt-1 flex items-center justify-center gap-6 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Cash on Delivery</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Open Parcel Check</span>
                </span>
              </div>
            </div>

            {/* More Fragrances */}
            {relatedProducts.length > 0 && (
              <div className="pt-5 border-t border-zinc-800/80">
                <div className="text-[11px] font-cinzel font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  More Fragrances
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {relatedProducts.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => {
                        setQuantity(1);
                        onSelectProduct(rel);
                      }}
                      className="group p-2 rounded-md bg-black border border-zinc-800 hover:border-[#d4af37]/60 transition-colors text-left"
                    >
                      <div className="w-full h-16 rounded-sm overflow-hidden bg-[#0c0c0e] flex items-center justify-center mb-1.5">
                        <PerfumeBottleVisual
                          product={rel}
                          size="sm"
                          className="!h-full !p-1"
                          interactive={false}
                        />
                      </div>
                      <div className="text-[11px] font-cinzel font-semibold text-white truncate group-hover:text-[#d4af37] transition-colors">
                        {rel.name.replace(' Inspired – 30ml', '')}
                      </div>
                      <div className="text-[10px] font-mono text-[#d4af37] tabular-nums">
                        Rs. {rel.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
