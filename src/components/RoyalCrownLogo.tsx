import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
}

export const BRAND_LOGO_URL = '/assets/aistudio/image_6fedb4b4.png';

export const RoyalCrownLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
}) => {
  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
  };

  const titleSizes = {
    sm: 'text-sm tracking-widest',
    md: 'text-base sm:text-lg tracking-[0.18em]',
    lg: 'text-xl sm:text-2xl tracking-[0.22em]',
    xl: 'text-2xl sm:text-3xl tracking-[0.25em]',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official U.R PERFUMES Circular Crest */}
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src={BRAND_LOGO_URL}
          alt="U.R PERFUMES Logo"
          referrerPolicy="no-referrer"
          className={`${iconSizes[size]} rounded-full object-cover border border-zinc-700/80 bg-black transition-transform duration-300 group-hover:scale-[1.03]`}
        />
      </div>

      {/* Brand Name & Tagline */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={`font-cinzel font-bold text-white uppercase ${titleSizes[size]} whitespace-nowrap`}>
            U.R <span className="text-[#d4af37]">PERFUMES</span>
          </span>
          {showSubtitle && (
            <span className="text-[9px] sm:text-[10px] tracking-[0.26em] text-zinc-400 uppercase font-sans mt-1 whitespace-nowrap">
              FRAGRANCE BEYOND TIME
            </span>
          )}
        </div>
      )}
    </div>
  );
};
