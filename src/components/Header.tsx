import React from 'react';
import { Layers, ShieldCheck, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'batch';
  onTabChange: (tab: 'single' | 'batch') => void;
  imageCount: number;
  onClear: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  imageCount,
  onClear,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-3.5 sm:px-6 lg:px-8 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-xl shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 m-0">
                  PicScale
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/80">
                  纯浏览器端
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 m-0">
                图片尺寸无损调整 · 目标体积压缩 · 批量导出
              </p>
            </div>
          </div>

          {/* Privacy badge for mobile */}
          <div className="md:hidden flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>本地计算</span>
          </div>
        </div>

        {/* Mode Switcher & Actions */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 w-full sm:w-auto">
            <button
              onClick={() => onTabChange('single')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'single'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>单图精细调整</span>
            </button>
            <button
              onClick={() => onTabChange('batch')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'batch'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>批量快速处理</span>
              {imageCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-50 text-[10px] text-indigo-700 border border-indigo-200/60">
                  {imageCount}
                </span>
              )}
            </button>
          </div>

          {imageCount > 0 && (
            <button
              onClick={onClear}
              title="清空当前列表"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200/70 hover:border-rose-200 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Privacy Pill for desktop */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/90 px-3 py-1.5 rounded-xl border border-emerald-200/70 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">本地引擎计算 · 绝不上传服务器 · 隐私安全</span>
          </div>
        </div>
      </div>
    </header>
  );
};
