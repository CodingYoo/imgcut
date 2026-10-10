import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: 'process' | 'creations';
  onTabChange: (tab: 'process' | 'creations') => void;
  creationsCount?: number;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  creationsCount = 0,
  onGoHome,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand + Nav Tabs */}
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Brand */}
          <BrandLogo size="md" showBadge={true} onClick={onGoHome} />

          {/* Navigation Links */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => onTabChange('process')}
              className={`relative py-1 text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'process'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              图片处理
              {activeTab === 'process' && (
                <div className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onTabChange('creations')}
              className={`relative py-1 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'creations'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>我的作品</span>
              {creationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[10px] text-blue-600 font-bold border border-blue-100">
                  {creationsCount}
                </span>
              )}
              {activeTab === 'creations' && (
                <div className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Right: Security Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="hidden md:inline">完全在浏览器中处理 · 无需安装 · 隐私安全</span>
          <span className="md:hidden">纯本地 · 隐私安全</span>
        </div>
      </div>
    </header>
  );
};
