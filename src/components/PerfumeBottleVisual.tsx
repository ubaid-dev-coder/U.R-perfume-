import React from 'react';
import { Product } from '../types';

interface PerfumeBottleVisualProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'detail';
  interactive?: boolean;
}

export const PerfumeBottleVisual: React.FC<PerfumeBottleVisualProps> = ({
  product,
  className = '',
  size = 'md',
  interactive = true,
}) => {
  const heightClasses = {
    sm: 'h-48',
    md: 'h-64 sm:h-72',
    lg: 'h-80 sm:h-96',
    detail: 'h-[360px] sm:h-[440px]',
  };

  const hasUploadedImage = Boolean(product.image && product.image.trim().length > 0);

  if (hasUploadedImage) {
    return (
      <div
        className={`relative w-full ${heightClasses[size]} overflow-hidden bg-[#0c0c0e] flex flex-col items-center justify-center p-2 group ${className}`}
      >
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-contain rounded-md transition-transform duration-300 ${
              interactive ? 'group-hover:scale-[1.02]' : ''
            }`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClasses[size]} overflow-hidden bg-[#0c0c0e] flex flex-col items-center justify-center p-6 group ${className}`}
    >
      <div
        className={`relative flex flex-col items-center justify-center transition-transform duration-300 ${
          interactive ? 'group-hover:scale-[1.03]' : ''
        }`}
      >
        <div className="relative z-20 flex flex-col items-center">
          <div className="w-5 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#e7c96b] to-[#996515] rounded-t-sm" />
          <div className="w-14 h-10 bg-gradient-to-r from-[#856404] via-[#d4af37] to-[#996515] rounded-sm border border-[#d4af37]/40 relative overflow-hidden flex items-center justify-center">
            <div className="w-6 h-6 border border-black/40 rounded-full flex items-center justify-center">
              <span className="text-[7px] font-cinzel font-bold text-black/80">UR</span>
            </div>
          </div>
          <div className="w-8 h-2 bg-zinc-400" />
        </div>

        <div className="relative z-10 w-28 sm:w-32 h-44 sm:h-52 rounded-t-md rounded-b-xl border border-white/20 bg-white/[0.04] p-1 overflow-hidden flex flex-col justify-between">
          <div className="relative w-full h-[88%] mt-2 rounded-t-sm rounded-b-lg overflow-hidden p-2 flex flex-col justify-end">
            <div className={`absolute inset-0 bg-gradient-to-b ${product.flaconDetails.liquidGradient} opacity-90`} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/30" />

            <div className="relative z-30 my-auto mx-auto w-[92%] bg-black/90 border border-[#d4af37]/70 rounded-sm p-2 text-center">
              <div className="text-[8px] font-cinzel font-bold tracking-widest text-[#d4af37]">
                U.R PERFUMES
              </div>
              <div className="text-[10px] sm:text-[11px] font-serif-luxury font-bold text-white tracking-wider leading-tight mt-1 truncate">
                {product.name.replace(' Inspired – 30ml', '')}
              </div>
              <div className="text-[7px] tracking-[0.2em] text-zinc-400 font-sans uppercase mt-0.5">
                EXTRAIT DE PARFUM
              </div>
              <div className="text-[7px] text-zinc-400 font-mono tracking-widest mt-0.5">
                30ml · 1.0 FL. OZ
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full h-4 bg-white/10 border-t border-white/15 rounded-b-lg flex items-center justify-center">
            <span className="text-[7px] text-white/50 tracking-[0.3em] font-cinzel">U.R</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400 font-sans tracking-wider">
        <span className="text-[#d4af37] font-semibold">30ml Flacon</span>
        <span>·</span>
        <span>{product.gender}</span>
      </div>
    </div>
  );
};
