import React, { useState } from 'react';
import { Store, StoreSettings } from '../types';
import { Phone, Mail, MapPin, Send, CheckCircle2, Clock, Instagram } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ContactSectionProps {
  settings: StoreSettings;
  selectedStore?: Store | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings, selectedStore }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  const activeWhatsapp = selectedStore?.whatsapp || settings.officialWhatsapp;
  const activePhone = selectedStore?.phone || settings.storePhone;
  const activeEmail = selectedStore?.email || settings.storeEmail;
  const activeAddress = selectedStore?.address || settings.storeAddress;
  const instagramUrl = settings.socialLinks?.instagram || 'https://www.instagram.com/ur.perfumes.official/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    const cleanNum = activeWhatsapp.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `Assalam-o-Alaikum U.R PERFUMES${selectedStore ? ` (${selectedStore.name})` : ''}!\n\nName: ${name}\nPhone: ${phone}\nInquiry: ${message}`
    );
    window.open(`https://wa.me/${cleanNum}?text=${waText}`, '_blank', 'noopener,noreferrer');

    setSentNotice(true);
    setName('');
    setPhone('');
    setMessage('');
    setTimeout(() => setSentNotice(false), 4000);
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
      <div className="space-y-2 max-w-2xl mb-12">
        <span className="text-[11px] font-cinzel font-semibold tracking-[0.24em] text-[#d4af37] uppercase">
          {selectedStore ? selectedStore.name : 'Contact & Orders'}
        </span>
        <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Get in Touch
        </h2>
        <p className="text-sm text-zinc-400">
          Questions about scent notes, delivery timing, or gift sets? Message us directly on WhatsApp or via the form below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Direct Channels */}
        <div className="bg-[#0b0b0d] border border-zinc-800 rounded-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-800/80">
              <h3 className="font-cinzel text-lg font-bold text-white">Direct Contact Channels</h3>
              {selectedStore && (
                <span className="text-[11px] text-[#d4af37] font-medium truncate">
                  {selectedStore.name}
                </span>
              )}
            </div>

            <a
              href={`https://wa.me/${activeWhatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 p-4 rounded-md bg-zinc-900/70 border border-zinc-700 hover:border-[#25D366]/60 transition-colors text-white group"
            >
              <div className="flex items-center gap-3.5">
                <WhatsAppIcon className="w-6 h-6 text-[#25D366] shrink-0" />
                <div>
                  <div className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">
                    Official WhatsApp Order Line
                  </div>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {activeWhatsapp}
                  </div>
                </div>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
                Chat →
              </span>
            </a>

            <div className="divide-y divide-zinc-800/80 text-xs sm:text-sm">
              <div className="py-3.5 flex items-center gap-3.5">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <div>
                  <div className="text-[11px] text-zinc-500">Phone Support</div>
                  <div className="font-mono text-zinc-200">{activePhone}</div>
                </div>
              </div>

              <div className="py-3.5 flex items-center gap-3.5">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <div>
                  <div className="text-[11px] text-zinc-500">Email</div>
                  <div className="text-zinc-200">{activeEmail}</div>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3.5">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-zinc-500">Location</div>
                  <div className="text-zinc-200">{activeAddress}</div>
                </div>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 flex items-center justify-between gap-3.5 group hover:text-[#d4af37] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Instagram className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <div>
                    <div className="text-[11px] text-zinc-500">Instagram</div>
                    <div className="text-zinc-200 group-hover:text-[#d4af37] transition-colors font-mono text-xs">
                      @ur.perfumes.official
                    </div>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-[#d4af37] transition-colors">
                  Follow →
                </span>
              </a>

              {selectedStore?.openingHours && (
                <div className="py-3.5 flex items-center gap-3.5">
                  <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <div>
                    <div className="text-[11px] text-zinc-500">Hours</div>
                    <div className="text-zinc-200">{selectedStore.openingHours}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Direct Message Form */}
        <div className="bg-[#0b0b0d] border border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
          <h3 className="font-cinzel text-lg font-bold text-white pb-4 border-b border-zinc-800/80">
            Send a Message
          </h3>

          {sentNotice && (
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Message prepared and opened in WhatsApp.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ubaid Khatri"
                className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Message or Scent Inquiry</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about fragrance notes, delivery timing, or gift orders..."
                className="w-full bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
