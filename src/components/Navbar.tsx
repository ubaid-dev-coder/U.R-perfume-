import React, { useState } from 'react';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Menu, X } from 'lucide-react';
import urBannerClean from '../assets/images/ur_perfumes_banner_clean_1794649471277.jpg';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
}) => {
  const { totalItemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'collections', label: 'Collections' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-zinc-800/90 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-8">
          <div
            onClick={() => handleNavClick('home')}
            className="cursor-pointer group shrink-0"
          >
            <RoyalCrownLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-cinzel font-semibold tracking-[0.18em] text-zinc-400 uppercase">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 relative py-1 ${
                    isActive
                      ? 'text-[#d4af37]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-[#d4af37]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-[#d4af37]/70 text-white transition-colors flex items-center justify-center group"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-zinc-300 group-hover:text-[#d4af37] transition-colors" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4af37] text-black font-bold text-[10px] flex items-center justify-center font-mono tabular-nums">
                  {totalItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-6 py-5 space-y-3">
            <nav className="flex flex-col space-y-2.5 text-sm font-cinzel tracking-widest text-zinc-300">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="text-left py-2 hover:text-[#d4af37] transition-colors border-b border-zinc-900"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Brand Showcase Banner */}
      <div
        onClick={() => handleNavClick('shop')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleNavClick('shop');
        }}
        title="Explore U.R PERFUMES Collection"
        className="w-full bg-black border-b border-zinc-800/90 cursor-pointer group overflow-hidden"
      >
        <div className="w-full max-w-[1440px] mx-auto relative">
          <img
            src={urBannerClean}
            alt="Welcome to U.R PERFUMES - Limited Edition Fragrances"
            referrerPolicy="no-referrer"
            className="w-full h-auto block group-hover:brightness-105 transition-all duration-300"
          />
        </div>
      </div>
    </>
  );
};
