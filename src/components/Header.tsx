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
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">
                PicScale
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                纯浏览器端
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              图片尺寸无损调整 · 目标体积压缩 · 批量导出
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('single')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              单图精细调整
            </button>
            <button
              onClick={() => onTabChange('batch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              批量快速处理
              {imageCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-indigo-300">
                  {imageCount}
                </span>
              )}
            </button>
          </div>

          {imageCount > 0 && (
            <button
              onClick={onClear}
              title="清空当前列表"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Privacy Pill */}
        <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400/90 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>本地引擎计算 · 绝不上传服务器 · 隐私安全</span>
        </div>
      </div>
    </header>
  );
};
