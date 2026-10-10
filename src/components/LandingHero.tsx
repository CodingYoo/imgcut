import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Layers,
  Sparkles,
  ShieldCheck,
  Crop,
  HardDrive,
  RefreshCw,
  Sliders,
  Palette,
  Droplet,
  MoreHorizontal,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import { createSampleImage } from '../utils/sampleImages';
import type { ActiveTool } from '../types';

const SAMPLE_PHOTOS = [
  {
    id: 'mountain' as const,
    label: '雪山',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=85',
    filename: 'sample_lake_mountain.jpg',
  },
  {
    id: 'sunset' as const,
    label: '日落',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=85',
    filename: 'sample_golden_sunset.jpg',
  },
  {
    id: 'cat' as const,
    label: '猫咪',
    thumb: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&auto=format&fit=crop&q=85',
    filename: 'sample_cute_cat.jpg',
  },
  {
    id: 'leaf' as const,
    label: '绿叶',
    thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=160&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1600&auto=format&fit=crop&q=85',
    filename: 'sample_green_monstera.jpg',
  },
  {
    id: 'city' as const,
    label: '建筑',
    thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=85',
    filename: 'sample_modern_architecture.jpg',
  },
];

interface LandingHeroProps {
  onFilesSelected: (files: File[], initialTool?: ActiveTool) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [pendingTool, setPendingTool] = useState<ActiveTool>('crop');

  // Global Ctrl+V paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onFilesSelected(files, pendingTool);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected, pendingTool]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesSelected(files, pendingTool);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files, pendingTool);
      e.target.value = '';
    }
  };

  const handleSelectSample = async (sample: typeof SAMPLE_PHOTOS[number]) => {
    try {
      const res = await fetch(sample.fullUrl);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], sample.filename, { type: blob.type || 'image/jpeg' });
        onFilesSelected([file], pendingTool);
        return;
      }
    } catch {
      // Fallback to high-res canvas generated image if network fetch is blocked
    }
    const fallbackFile = createSampleImage(sample.id);
    onFilesSelected([fallbackFile], pendingTool);
  };

  const handleLoadFromUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setIsLoadingUrl(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const filename = url.split('/').pop()?.split('?')[0] || 'online_image.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      onFilesSelected([file], pendingTool);
    } catch {
      alert('无法直接跨域加载该 URL 图片，请将图片另存为后上传或复制图片直接 Ctrl + V 粘贴。');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const triggerUploadWithTool = (tool: ActiveTool) => {
    setPendingTool(tool);
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-14 flex flex-col gap-12">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main 3-Column Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Heading & 4 Feature Badges */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 leading-tight tracking-tight m-0">
              简单 · 高效 · 专业的
              <br />
              在线图片处理工具
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-3.5 leading-relaxed m-0">
              支持 JPG、PNG、WebP、GIF、BMP 等格式，满足你的图片处理需求。
            </p>
          </div>

          {/* 2x2 Feature Cards with enhanced high-contrast visual tokens */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-2">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-800 font-bold text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
                  <FileImage className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="truncate">多种格式支持</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 m-0 pl-0 sm:pl-9 truncate">
                JPG / PNG / WebP / GIF / BMP
              </p>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-800 font-bold text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60 shadow-2xs">
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="truncate">批量处理</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 m-0 pl-0 sm:pl-9 truncate">
                一次处理多张图片
              </p>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-800 font-bold text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100/60 shadow-2xs">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="truncate">高质量输出</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 m-0 pl-0 sm:pl-9 truncate">
                高清无损，画质清晰
              </p>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-800 font-bold text-xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="truncate">本地处理</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 m-0 pl-0 sm:pl-9 truncate">
                数据不上传，隐私安全
              </p>
            </div>
          </div>
        </div>

        {/* Center Column: The Primary Upload Box Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative bg-white rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-500/10 scale-[1.01]'
                : 'border-blue-200/90 hover:border-blue-400 shadow-[0_4px_25px_rgba(0,0,0,0.03)]'
            }`}
          >
            {/* High-Fidelity Upload Icon with depth */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/60 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-3.5 shadow-sm shadow-blue-500/10 group-hover:scale-105 transition-transform duration-300">
              <div className="w-11 h-11 rounded-xl bg-white shadow-2xs flex items-center justify-center border border-blue-100/80 text-blue-600">
                <UploadCloud className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">
              点击上传 或 拖拽图片到此处
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              支持 JPG、PNG、WebP、GIF、BMP 等格式，单张或批量上传均可。
            </p>

            {/* Blue Select Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>选择图片</span>
            </button>

            {/* 5 High-Fidelity Photo Thumbnails Row */}
            <div className="w-full pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-slate-100 flex flex-col items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">或试用高保真示例图片:</span>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full overflow-x-auto py-1 px-1">
                {SAMPLE_PHOTOS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSample(item)}
                    className="group/thumb relative flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
                    title={`测试样本：${item.label}`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden group-hover/thumb:border-blue-500 group-hover/thumb:shadow-md transition-all bg-slate-100">
                      <img
                        src={item.thumb}
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          try {
                            const fallbackFile = createSampleImage(item.id);
                            target.src = URL.createObjectURL(fallbackFile);
                          } catch {
                            // ignore
                          }
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover/thumb:text-blue-600 font-medium mt-1">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paste URL Input bar */}
            <div className="w-full mt-4 pt-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>或者粘贴图片链接进行处理</span>
              </div>
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="请输入图片 URL 地址"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadFromUrl()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleLoadFromUrl}
                  disabled={isLoadingUrl || !imageUrlInput.trim()}
                  className="absolute right-1.5 p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity 3D Photo Proxy Mockup */}
        <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
          {/* Layered High-Fidelity Photo Cards with depth */}
          <div className="relative w-56 h-40 mx-auto lg:mx-0 flex items-center justify-center">
            {/* Ambient colorful glow */}
            <div className="absolute w-44 h-28 rounded-3xl bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-sky-400/20 blur-xl pointer-events-none" />

            {/* Layer 1 (Back card): Glassmorphic angled card */}
            <div className="absolute w-44 h-28 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 -rotate-8 transform translate-x-3 -translate-y-2 shadow-sm" />

            {/* Layer 2 (Middle card): Subtle rotated card */}
            <div className="absolute w-44 h-28 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 rotate-4 transform translate-x-1 shadow-md" />

            {/* Layer 3 (Front card): High-fidelity photograph with interactive crop corner badge */}
            <div className="relative w-48 h-32 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-1.5 flex flex-col group transition-transform hover:-translate-y-1 duration-300">
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                {/* Real High-Fidelity Landscape Image */}
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
                  alt="High-Fidelity Photo Preview"
                  className="w-full h-full object-cover"
                />

                {/* Subtle crop overlay grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div />
                </div>

                {/* Floating glowing blue crop badge in bottom-right (matching user screenshot) */}
                <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-blue-600/90 backdrop-blur-md border border-white/40 text-white shadow-lg shadow-blue-500/30 flex items-center gap-1">
                  <Crop className="w-2.5 h-2.5 text-white" />
                  <span className="text-[9px] font-bold tracking-tight">智能裁剪</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              让图片处理更简单
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs m-0">
              无需注册，打开即用，轻松完成各种图片编辑需求。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Popular Tools Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-200/70">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          热门处理功能
        </span>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'crop', label: '裁剪', icon: Crop },
            { id: 'rotate', label: '旋转', icon: RefreshCw },
            { id: 'convert', label: '格式', icon: Sliders },
            { id: 'compress', label: '压缩', icon: HardDrive },
            { id: 'filter', label: '滤镜', icon: Palette },
            { id: 'watermark', label: '水印', icon: Droplet },
            { id: 'more', label: '更多', icon: MoreHorizontal },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => triggerUploadWithTool(tool.id as ActiveTool)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
