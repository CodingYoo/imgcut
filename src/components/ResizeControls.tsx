import React, { useState } from 'react';
import {
  Sliders,
  Maximize2,
  Percent,
  HardDrive,
  LayoutGrid,
  Lock,
  Unlock,
  Palette,
  FileCheck,
} from 'lucide-react';
import type { ResizeSettings, ResizeMode, FitMode, OutputFormat } from '../types';
import { PRESETS, PRESET_CATEGORIES } from '../utils/presets';

interface ResizeControlsProps {
  settings: ResizeSettings;
  onChange: (settings: ResizeSettings) => void;
  originalWidth: number;
  originalHeight: number;
}

export const ResizeControls: React.FC<ResizeControlsProps> = ({
  settings,
  onChange,
  originalWidth,
  originalHeight,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('id_photo');

  // Handle Dimension changes
  const handleWidthChange = (val: number) => {
    const width = Math.max(1, val);
    let height = settings.height;
    if (settings.lockAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      height = Math.max(1, Math.round(width * ratio));
    }
    onChange({ ...settings, width, height });
  };

  const handleHeightChange = (val: number) => {
    const height = Math.max(1, val);
    let width = settings.width;
    if (settings.lockAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      width = Math.max(1, Math.round(height * ratio));
    }
    onChange({ ...settings, width, height });
  };

  // Switch Mode
  const setMode = (mode: ResizeMode) => {
    onChange({ ...settings, mode });
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 shadow-xl flex flex-col gap-5">
      {/* Top Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white m-0">调整参数配置</h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          基准: {originalWidth} × {originalHeight} px
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {[
          { id: 'dimensions', label: '自定义尺寸', icon: Maximize2 },
          { id: 'percentage', label: '百分比缩放', icon: Percent },
          { id: 'target_size', label: '目标体积(KB)', icon: HardDrive },
          { id: 'preset', label: '预设规格', icon: LayoutGrid },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = settings.mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as ResizeMode)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Specific Panel */}
      <div className="min-h-[160px] flex flex-col justify-center">
        {/* 1. Custom Dimensions Mode */}
        {settings.mode === 'dimensions' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  宽度 (Width)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    px
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  高度 (Height)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    px
                  </span>
                </div>
              </div>
            </div>

            {/* Lock Aspect Ratio & Fit Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    lockAspectRatio: !settings.lockAspectRatio,
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  settings.lockAspectRatio
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {settings.lockAspectRatio ? (
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span>锁定等比例缩放</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">适配模式:</span>
                <select
                  value={settings.fitMode}
                  onChange={(e) =>
                    onChange({ ...settings, fitMode: e.target.value as FitMode })
                  }
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="inside">按最大边自适应 (Inside)</option>
                  <option value="cover">居中裁切填满 (Cover)</option>
                  <option value="contain">等比完整包含 (Contain 留白)</option>
                  <option value="stretch">直接拉伸填充 (Stretch)</option>
                </select>
              </div>
            </div>

            {/* Contain Background color picker */}
            {settings.fitMode === 'contain' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>留白边缘背景填充颜色:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.fillColor}
                    onChange={(e) =>
                      onChange({ ...settings, fillColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400">
                    {settings.fillColor}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Percentage Mode */}
        {settings.mode === 'percentage' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                缩放比例
              </span>
              <span className="text-base font-bold text-indigo-400 font-mono">
                {settings.percentage}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={settings.percentage}
              onChange={(e) =>
                onChange({ ...settings, percentage: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100, 150, 200].map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ ...settings, percentage: p })}
                  className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    settings.percentage === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 text-center font-mono">
              预计输出分辨率：
              {Math.max(1, Math.round((originalWidth * settings.percentage) / 100))}{' '}
              ×{' '}
              {Math.max(1, Math.round((originalHeight * settings.percentage) / 100))}{' '}
              px
            </div>
          </div>
        )}

        {/* 3. Target Size (KB) Mode */}
        {settings.mode === 'target_size' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  指定目标文件体积 (上限)
                </label>
                <span className="text-xs font-bold text-indigo-400 font-mono">
                  ≤ {settings.targetSizeKB} KB
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="10000"
                  value={settings.targetSizeKB}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      targetSizeKB: Math.max(5, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                  KB
                </span>
              </div>
            </div>

            {/* Quick KB Presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '公考 ≤ 20K', kb: 20 },
                { label: '国考 ≤ 50K', kb: 50 },
                { label: '教资 ≤ 100K', kb: 100 },
                { label: '标准 ≤ 200K', kb: 200 },
                { label: '高清 ≤ 500K', kb: 500 },
                { label: '网页 ≤ 1MB', kb: 1024 },
              ].map((item) => (
                <button
                  key={item.kb}
                  onClick={() => onChange({ ...settings, targetSizeKB: item.kb })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.targetSizeKB === item.kb
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
              💡 核心算法将在浏览器本地通过多轮二分逼近质量参数和自适应微调分辨率，确保输出文件体积在限制之内且画质最佳。
            </p>
          </div>
        )}

        {/* 4. Presets Mode */}
        {settings.mode === 'preset' && (
          <div className="flex flex-col gap-3">
            {/* Category Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
              {PRESETS.filter((p) => p.category === activeCategory).map((preset) => {
                const isSelected = settings.selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onChange({
                        ...settings,
                        selectedPresetId: preset.id,
                        width: preset.width,
                        height: preset.height,
                        fitMode: 'cover',
                      });
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">
                        {preset.name}
                      </span>
                      {preset.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-indigo-400">
                      {preset.width} × {preset.height} px
                    </div>
                    {preset.description && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Output Format & Quality Section */}
      <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>导出格式与压缩质量</span>
          </div>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'image/webp', label: 'WebP', note: '高压缩率·推荐' },
            { id: 'image/jpeg', label: 'JPEG', note: '通用兼容·照片' },
            { id: 'image/png', label: 'PNG', note: '无损透明·图标' },
          ].map((fmt) => {
            const isSelected = settings.format === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() =>
                  onChange({ ...settings, format: fmt.id as OutputFormat })
                }
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold">{fmt.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{fmt.note}</span>
              </button>
            );
          })}
        </div>

        {/* Quality Slider (hidden for PNG) */}
        {settings.format !== 'image/png' && settings.mode !== 'target_size' && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">图像品质 (Quality)</span>
              <span className="font-mono font-bold text-indigo-400">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.quality}
              onChange={(e) =>
                onChange({ ...settings, quality: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>小体积 (较模糊)</span>
              <span>平衡 (推荐 80%)</span>
              <span>高保真 (近无损)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
