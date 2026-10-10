import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = false,
  onClick,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* High-Fidelity Vector Logo Icon */}
      <div
        className={`${iconSizes[size]} relative rounded-xl shadow-sm shadow-blue-500/25 overflow-hidden shrink-0 transition-transform group-hover:scale-105 duration-200`}
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 45%, #6366f1 100%)',
        }}
      >
        {/* Subtle glass reflection highlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)',
          }}
        />

        {/* SVG Graphic: Frame + Mountain + Sun + Scaling Crop Handles */}
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 relative z-10"
        >
          {/* Main Picture Frame */}
          <rect
            x="6"
            y="7"
            width="22"
            height="18"
            rx="3.5"
            stroke="white"
            strokeWidth="2.2"
            strokeOpacity="0.95"
            fill="none"
          />

          {/* Sun / Sparkle circle */}
          <circle cx="12" cy="12.5" r="2.2" fill="white" />

          {/* Mountains */}
          <path
            d="M8.5 22L14 15.5L18.5 21L21.5 17.5L25.5 22H8.5Z"
            fill="white"
            fillOpacity="0.95"
          />

          {/* Scale & Crop Bracket overlay accent in top-right / bottom-right */}
          <path
            d="M21 5H27C28.6569 5 30 6.34315 30 8V14"
            stroke="#93c5fd"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30 21V27C30 28.6569 28.6569 30 27 30H21"
            stroke="#93c5fd"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="7" r="1.5" fill="#ffffff" />
          <circle cx="28" cy="28" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography: PicScale */}
      <div className="flex items-center gap-2">
        <span className={`font-black tracking-tight ${textSizes[size]} text-slate-900 leading-none`}>
          Pic<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Scale</span>
        </span>

        {showBadge && (
          <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/70 font-mono tracking-tight shadow-2xs">
            纯浏览器端
          </span>
        )}
      </div>
    </div>
  );
};
