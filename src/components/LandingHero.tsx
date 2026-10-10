import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Layers,
  Sparkles,
  ShieldCheck,
  Crop,
  Maximize2,
  HardDrive,
  RefreshCw,
  MoreHorizontal,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import { createSampleImage } from '../utils/sampleImages';
import type { ActiveTool } from '../types';

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

  const handleSelectSample = (type: 'mountain' | 'sunset' | 'cat' | 'leaf' | 'city') => {
    const file = createSampleImage(type);
    onFilesSelected([file], pendingTool);
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

          {/* 2x2 Feature Cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <FileImage className="w-4 h-4 text-blue-600" />
                <span>多种格式支持</span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">
                JPG / PNG / WebP / GIF / BMP
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>批量处理</span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">
                一次处理多张图片
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>高质量输出</span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">
                高清无损，画质清晰
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>本地处理</span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">
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
            className={`relative bg-white rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/40 shadow-lg shadow-blue-500/10 scale-[1.01]'
                : 'border-blue-200/90 hover:border-blue-400 shadow-[0_4px_25px_rgba(0,0,0,0.03)]'
            }`}
          >
            {/* Cloud Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3.5 shadow-xs">
              <UploadCloud className="w-7 h-7" />
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
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>选择图片</span>
            </button>

            {/* 5 Sample Thumbnails Row */}
            <div className="w-full pt-6 mt-6 border-t border-slate-100 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full">
                {[
                  { id: 'mountain', label: '雪山', preview: 'linear-gradient(135deg, #38bdf8, #0284c7)' },
                  { id: 'sunset', label: '日落', preview: 'linear-gradient(135deg, #f97316, #b45309)' },
                  { id: 'cat', label: '猫咪', preview: 'linear-gradient(135deg, #fef3c7, #d97706)' },
                  { id: 'leaf', label: '绿叶', preview: 'linear-gradient(135deg, #bbf7d0, #16a34a)' },
                  { id: 'city', label: '城市', preview: 'linear-gradient(135deg, #4338ca, #db2777)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSample(item.id as any)}
                    className="group flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                    title={`测试样本：${item.label}`}
                  >
                    <div
                      style={{ background: item.preview }}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-slate-200/80 shadow-xs flex items-center justify-center text-xs font-bold text-white group-hover:border-blue-500"
                    >
                      {item.label === '雪山' && '🏔️'}
                      {item.label === '日落' && '🌅'}
                      {item.label === '猫咪' && '🐱'}
                      {item.label === '绿叶' && '🍃'}
                      {item.label === '城市' && '🏙️'}
                    </div>
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
                  className="absolute right-1.5 p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Illustration & Value Proposition */}
        <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
          {/* Layered illustration cards */}
          <div className="relative w-48 h-36 mx-auto lg:mx-0 flex items-center justify-center">
            {/* Background layered card */}
            <div className="absolute w-36 h-28 rounded-2xl bg-blue-100/60 border border-blue-200/80 -rotate-6 transform translate-x-2 translate-y-1 shadow-sm" />
            <div className="absolute w-36 h-28 rounded-2xl bg-blue-50 border border-blue-200 rotate-3 transform shadow-sm" />
            {/* Front card with mountain & sun */}
            <div className="relative w-40 h-28 rounded-2xl bg-white border border-slate-200 shadow-md p-2 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-blue-400" />
                <div className="p-1 rounded bg-blue-50 text-blue-600">
                  <Crop className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-end justify-center gap-1 -mb-1">
                <div className="w-16 h-10 bg-blue-200 rounded-t-lg" />
                <div className="w-20 h-14 bg-blue-400 rounded-t-lg" />
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
            { id: 'resize', label: '调整尺寸', icon: Maximize2 },
            { id: 'compress', label: '压缩', icon: HardDrive },
            { id: 'convert', label: '格式转换', icon: RefreshCw },
            { id: 'more', label: '更多工具', icon: MoreHorizontal },
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
