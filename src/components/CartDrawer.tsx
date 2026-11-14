import React from 'react';
import { useCart } from '../context/CartContext';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryCharges,
    totalAmount,
    settings,
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingDifference = settings.freeDeliveryThreshold - subtotal;
  const progressPercent = Math.min(100, Math.round((subtotal / settings.freeDeliveryThreshold) * 100));

  const handleCheckoutClick = () => {
    closeCart();
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0b0b0d] border-l border-zinc-800 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-baseline gap-2">
              <span className="font-cinzel font-bold text-base tracking-wide text-white uppercase">
                Shopping Bag
              </span>
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                ({items.length})
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-900"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="p-4 bg-black/50 border-b border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-2 font-medium">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                {freeShippingDifference > 0 ? (
                  <>
                    Add <span className="text-[#d4af37] font-semibold tabular-nums">Rs. {freeShippingDifference.toLocaleString()}</span> for free delivery
                  </>
                ) : (
                  <span className="text-emerald-400 font-semibold">Free nationwide delivery unlocked</span>
                )}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-sm overflow-hidden">
              <div
                className="bg-[#d4af37] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-800/70">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-cinzel text-lg text-white font-semibold">Your Bag is Empty</h3>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Browse our 30ml Extrait de Parfum fragrances to add items to your bag.
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold text-xs rounded-md uppercase tracking-wider transition-colors"
                >
                  Browse Fragrances
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  <div className="w-20 h-24 shrink-0 rounded-md overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
                    <PerfumeBottleVisual
                      product={item.product}
                      size="sm"
                      className="!h-full !p-1.5"
                      interactive={false}
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-cinzel text-sm font-semibold text-white leading-snug line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                        {item.product.size} · Extrait Oil
                      </div>
                      <div className="text-sm font-serif-luxury font-bold text-[#d4af37] mt-1 tabular-nums">
                        Rs. {item.product.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-zinc-700 rounded-md bg-black">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-medium text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-mono text-zinc-300 tabular-nums">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-800 bg-zinc-950 space-y-3">
              <div className="space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charges</span>
                  <span className="font-mono">
                    {deliveryCharges === 0 ? (
                      <span className="text-emerald-400 font-semibold uppercase">FREE</span>
                    ) : (
                      `Rs. ${deliveryCharges.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800 text-white">
                  <span className="font-cinzel">Total (COD)</span>
                  <span className="text-[#d4af37] font-mono text-base">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3 px-4 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 text-center pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Cash on Delivery · Open Parcel Check Nationwide</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
