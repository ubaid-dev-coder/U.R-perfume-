import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-lg bg-[#0b0b0d] border border-zinc-800 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[11px] font-cinzel font-semibold tracking-[0.22em] text-[#d4af37] uppercase">
            New Releases
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Restocks & Seasonal Offers
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Receive an update when new 30ml scents or bundle deals go live. No spam.
          </p>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[400px]">
          {subscribed ? (
            <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Subscribed to U.R PERFUMES launch updates.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-black border border-zinc-700 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs uppercase tracking-wider rounded-md transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
