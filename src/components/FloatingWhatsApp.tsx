import React, { useState } from 'react';
import { Store, StoreSettings } from '../types';
import { X } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface FloatingWhatsAppProps {
  settings: StoreSettings;
  selectedStore?: Store | null;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ settings, selectedStore }) => {
  const [showBubble, setShowBubble] = useState(false);

  const activeWhatsapp = selectedStore?.whatsapp || settings.officialWhatsapp;
  const cleanNum = activeWhatsapp.replace(/[^0-9]/g, '');
  const chatUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(
    `Assalam-o-Alaikum U.R PERFUMES${selectedStore ? ` (${selectedStore.name})` : ''}! I would like to inquire about your perfume collection.`
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {showBubble && (
        <div className="w-72 bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-2xl text-white space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#25D366] flex items-center justify-center text-white shrink-0">
                <WhatsAppIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-cinzel text-xs font-bold text-white">
                  {selectedStore ? selectedStore.name : 'U.R PERFUMES'}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  {activeWhatsapp}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBubble(false)}
              className="text-zinc-500 hover:text-white"
              aria-label="Close WhatsApp popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            Assalam-o-Alaikum. Message us directly on WhatsApp for fragrance guidance or Cash on Delivery orders.
          </p>

          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Open WhatsApp Chat</span>
          </a>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowBubble((prev) => !prev)}
          className="hidden sm:flex items-center gap-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 hover:border-[#d4af37]/60 text-white px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shadow-lg"
        >
          <span>Order on WhatsApp</span>
        </button>

        <a
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order or Chat on WhatsApp"
          className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform"
        >
          <WhatsAppIcon className="w-6 h-6" />
          <span className="sr-only">Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
