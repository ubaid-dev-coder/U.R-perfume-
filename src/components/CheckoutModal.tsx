import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { StoreService } from '../services/storeService';
import { Order } from '../types';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import { X, CheckCircle2, ShieldCheck, Truck, Copy, Check } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: Order) => void;
}

const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Gujrat',
  'Mardan',
  'Mirpur (AJK)',
  'Other City',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted,
}) => {
  const {
    items,
    subtotal,
    clearCart,
    directCheckoutItem,
    setDirectCheckoutItem,
    settings,
    selectedStore,
  } = useCart();

  const activeWhatsapp = selectedStore?.whatsapp || settings.officialWhatsapp;
  const cleanActiveWa = activeWhatsapp.replace(/[^0-9]/g, '');

  const activeItems = directCheckoutItem ? [directCheckoutItem] : items;
  const activeSubtotal = directCheckoutItem
    ? directCheckoutItem.product.price * directCheckoutItem.quantity
    : subtotal;
  const activeDelivery =
    activeSubtotal === 0 || activeSubtotal >= settings.freeDeliveryThreshold
      ? 0
      : settings.deliveryCharge;
  const activeTotal = activeSubtotal + activeDelivery;

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Karachi');
  const [customCity, setCustomCity] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    if (sameAsMobile) {
      setWhatsappNumber(val);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!fullName.trim()) {
      setValidationError('Please enter your full name');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setValidationError('Please enter a valid Pakistani mobile number (e.g. 03001234567)');
      return;
    }
    if (!address.trim()) {
      setValidationError('Please enter your complete delivery street address');
      return;
    }

    const effectiveCity = city === 'Other City' ? (customCity.trim() || 'Pakistan') : city;
    const effectiveWhatsapp = sameAsMobile ? mobileNumber : whatsappNumber.trim() || mobileNumber;

    setIsSubmitting(true);

    try {
      const orderItems = activeItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        size: item.product.size,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image || '',
      }));

      const newOrder = StoreService.createOrder({
        storeId: selectedStore?.id,
        storeName: selectedStore?.name,
        customer: {
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.trim(),
          whatsappNumber: effectiveWhatsapp,
          address: address.trim(),
          city: effectiveCity,
          orderNotes: orderNotes.trim() || undefined,
        },
        items: orderItems,
        subtotal: activeSubtotal,
        deliveryCharges: activeDelivery,
        totalAmount: activeTotal,
        paymentMethod: 'Cash on Delivery (COD)',
      });

      clearCart();
      setDirectCheckoutItem(null);
      setCompletedOrder(newOrder);
      if (onOrderCompleted) {
        onOrderCompleted(newOrder);
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setValidationError('An error occurred while creating your order. Please try again or order on WhatsApp directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleModalClose = () => {
    setCompletedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#0b0b0d] border border-zinc-800 rounded-lg shadow-2xl text-white overflow-hidden my-auto">
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RoyalCrownLogo size="sm" iconOnly />
            <div>
              <h2 className="font-cinzel font-bold text-base sm:text-lg text-white">
                {completedOrder ? 'Order Confirmation' : 'Cash on Delivery Checkout'}
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                {completedOrder
                  ? 'Your order has been recorded and sent to our dispatch team.'
                  : `Free delivery over Rs. ${settings.freeDeliveryThreshold.toLocaleString()} anywhere in Pakistan`}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {completedOrder ? (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37]">
                  Order Received
                </span>
                <h3 className="font-cinzel text-2xl font-bold text-white">
                  Thank you, {completedOrder.customer.fullName}
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Your order has been saved. Our team will confirm via call or WhatsApp before dispatching.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-black border border-zinc-700 px-4 py-2 rounded-md">
                <span className="text-xs text-zinc-400">Order ID:</span>
                <span className="font-mono text-base font-bold text-[#d4af37]">
                  {completedOrder.id}
                </span>
                <button
                  onClick={() => copyOrderId(completedOrder.id)}
                  className="text-zinc-400 hover:text-white transition-colors"
                  title="Copy Order ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-black border border-zinc-800 rounded-md p-4 text-left space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                  Delivery Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Recipient:</span>{' '}
                    <span className="text-white font-medium">{completedOrder.customer.fullName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Contact:</span>{' '}
                    <span className="text-white font-medium">{completedOrder.customer.mobileNumber}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500">Address:</span>{' '}
                    <span className="text-white font-medium">
                      {completedOrder.customer.address}, {completedOrder.customer.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Payment:</span>{' '}
                    <span className="text-[#d4af37] font-medium">{completedOrder.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Estimated Delivery:</span>{' '}
                    <span className="text-emerald-400 font-medium">2–4 Working Days</span>
                  </div>
                  {completedOrder.storeName && (
                    <div className="sm:col-span-2">
                      <span className="text-zinc-500">Branch:</span>{' '}
                      <span className="text-[#d4af37] font-medium">{completedOrder.storeName}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pt-3 pb-1">
                  Items Ordered
                </div>
                <div className="space-y-1.5 text-xs tabular-nums">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-zinc-300">
                      <span>
                        {item.productName} ({item.size}) <span className="text-zinc-500">× {item.quantity}</span>
                      </span>
                      <span className="font-mono text-white">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
                    <span className="font-cinzel">Total Payable (COD)</span>
                    <span className="text-[#d4af37] font-mono text-base">
                      Rs. {completedOrder.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <a
                  href={StoreService.generateOrderWhatsAppUrl(completedOrder, selectedStore)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Confirm on WhatsApp ({activeWhatsapp})</span>
                </a>
                <p className="text-[11px] text-zinc-500">
                  Opens WhatsApp with your order summary pre-filled for faster dispatch.
                </p>
              </div>

              <button
                onClick={handleModalClose}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {validationError && (
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
                  {validationError}
                </div>
              )}

              <div className="bg-black border border-zinc-800 rounded-md p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between tabular-nums">
                  <span>Order Summary ({activeItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span className="text-[#d4af37] font-mono font-bold">
                    Rs. {activeTotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 divide-y divide-zinc-800/60">
                  {activeItems.map((item) => (
                    <div key={item.product.id} className="pt-2 first:pt-0 flex items-center gap-3">
                      <div className="w-10 h-12 shrink-0 rounded-sm bg-zinc-900 overflow-hidden">
                        <PerfumeBottleVisual
                          product={item.product}
                          size="sm"
                          className="!h-full !p-1"
                          interactive={false}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-cinzel font-semibold text-white truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          Qty: {item.quantity} × Rs. {item.product.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs font-mono font-semibold text-zinc-200 tabular-nums">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap justify-between gap-2 text-xs text-zinc-400 tabular-nums">
                  <span>Delivery: {activeDelivery === 0 ? 'FREE' : `Rs. ${activeDelivery}`}</span>
                  {selectedStore && (
                    <span>Branch: <strong className="text-[#d4af37]">{selectedStore.name}</strong></span>
                  )}
                  <span>Payment: <strong className="text-white">Cash on Delivery</strong></span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Delivery Details</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ubaid Khatri"
                    className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-300">
                        WhatsApp Number
                      </label>
                      <label className="text-[10px] text-zinc-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => {
                            setSameAsMobile(e.target.checked);
                            if (e.target.checked) setWhatsappNumber(mobileNumber);
                          }}
                          className="rounded bg-zinc-800 border-zinc-700 text-[#d4af37] focus:ring-0"
                        />
                        <span>Same as mobile</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      disabled={sameAsMobile}
                      value={sameAsMobile ? mobileNumber : whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="0339 0108748"
                      className={`w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] font-mono ${
                        sameAsMobile ? 'opacity-65 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      {PAKISTAN_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-zinc-950 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {city === 'Other City' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        City / Area <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="e.g. Swat / Larkana"
                        className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  )}

                  <div className={city === 'Other City' ? 'sm:col-span-3' : 'sm:col-span-2'}>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Delivery Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Flat No., Street, Sector / Area"
                      className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call before delivery, deliver after 2 PM..."
                    className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] resize-none"
                  />
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-md p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300">
                  <div className="font-semibold text-white">Cash on Delivery (COD)</div>
                  <p className="text-zinc-400 mt-0.5">
                    Pay in cash to the rider when your parcel arrives. No advance card payment required.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || activeItems.length === 0}
                  className="w-full py-3.5 px-4 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 tabular-nums"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <span>Confirm Order · Rs. {activeTotal.toLocaleString()} (COD)</span>
                  )}
                </button>

                <div className="text-center">
                  <span className="text-zinc-500 text-xs">Prefer ordering directly on chat? </span>
                  <a
                    href={`https://wa.me/${cleanActiveWa}?text=${encodeURIComponent(
                      `Assalam-o-Alaikum U.R PERFUMES${selectedStore ? ` (${selectedStore.name})` : ''}! I want to order:\n• Items: ${activeItems
                        .map((i) => `${i.product.name} x${i.quantity}`)
                        .join(', ')}\n• Total: Rs. ${activeTotal.toLocaleString()}\nPlease confirm!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>Order on WhatsApp</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
