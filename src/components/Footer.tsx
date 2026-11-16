import React from 'react';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import { Store, StoreSettings } from '../types';
import { Phone, Mail, MapPin, ShieldCheck, Instagram } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface FooterProps {
  settings: StoreSettings;
  selectedStore?: Store | null;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  selectedStore,
  onNavigate,
}) => {
  const activeWhatsapp = selectedStore?.whatsapp || settings.officialWhatsapp;
  const activePhone = selectedStore?.phone || settings.storePhone;
  const activeEmail = selectedStore?.email || settings.storeEmail;
  const activeAddress = selectedStore?.address || settings.storeAddress;
  const cleanNum = activeWhatsapp.replace(/[^0-9]/g, '');
  const instagramUrl = settings.socialLinks?.instagram || 'https://www.instagram.com/ur.perfumes.official/';

  return (
    <footer className="bg-[#08080a] border-t border-zinc-900 text-zinc-400 font-sans">
      <div className="border-b border-zinc-900 py-4 px-4 bg-black/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Cash on Delivery Nationwide · 2–4 Day Dispatch Across Pakistan</span>
          </div>
          <a
            href={`https://wa.me/${cleanNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#25D366] hover:text-emerald-300 font-medium transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>WhatsApp Desk: {activeWhatsapp}</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <RoyalCrownLogo size="md" />
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Concentrated 30ml Extrait de Parfum fragrances inspired by classic designer scents, delivered nationwide on Cash on Delivery.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/${cleanNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-900 border border-zinc-700 hover:border-[#25D366]/60 text-zinc-200 hover:text-white transition-colors text-xs font-medium"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-900 border border-zinc-700 hover:border-[#d4af37]/60 text-zinc-200 hover:text-white transition-colors text-xs font-medium"
            >
              <Instagram className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-cinzel text-xs font-bold text-white tracking-widest uppercase">
            Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-[#d4af37] transition-colors">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-[#d4af37] transition-colors">
                Shop 30ml Fragrances
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('collections')} className="hover:text-[#d4af37] transition-colors">
                Scent Collections
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-[#d4af37] transition-colors">
                About U.R PERFUMES
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-[#d4af37] transition-colors">
                Contact & Inquiries
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-cinzel text-xs font-bold text-white tracking-widest uppercase">
            Signature Line (30ml)
          </h4>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li>1. Gucci Flora Inspired</li>
            <li>2. Black Opium Inspired</li>
            <li>3. Janan Gold Inspired</li>
            <li>4. Amir Al Oud Inspired</li>
            <li>5. Azzaro Wanted Inspired</li>
            <li>6. Invictus Inspired</li>
            <li>7. Janan Sports Inspired</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-cinzel text-xs font-bold text-white tracking-widest uppercase">
            {selectedStore ? selectedStore.name : 'Pakistan Support'}
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="font-mono text-zinc-300">{activePhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-zinc-300">{activeEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
              <span className="text-zinc-300">{activeAddress}</span>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#d4af37] transition-colors text-xs font-medium"
              >
                <Instagram className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Instagram</span>
              </a>
              <span>·</span>
              <a
                href={`https://wa.me/${cleanNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline text-xs font-medium"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-900 py-5 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} <strong className="text-zinc-300">U.R PERFUMES</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>11F New Karachi, Karachi, Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
