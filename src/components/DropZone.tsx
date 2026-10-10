import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Clipboard, ShieldCheck } from 'lucide-react';
import { createSampleImage } from '../utils/sampleImages';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, compact = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste support (Ctrl+V)
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
        onFilesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

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
        onFilesSelected(files);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = '';
    }
  };

  const loadSample = (type: 'landscape' | 'portrait' | 'ultra') => {
    const sample = createSampleImage(type);
    onFilesSelected([sample]);
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-medium">
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          <span>点击或拖入更多图片继续添加</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 group ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/10'
            : 'border-slate-800 hover:border-indigo-500/60 bg-gradient-to-b from-slate-900/90 to-slate-950 hover:bg-slate-900/90 shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Pulse glow background */}
        <div className="absolute inset-0 bg-radial from-indigo-500/5 via-transparent to-transparent pointer-events-none rounded-3xl" />

        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-all duration-300 shadow-inner">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            点击上传或将图片拖拽至此处
          </h2>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            支持 JPG、PNG、WebP、GIF、BMP 等常见格式。支持多图批量上传或截图后直接
            <kbd className="mx-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold">
              Ctrl + V
            </kbd>
            粘贴。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              支持剪贴板粘贴
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              支持批量多选
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              浏览器离线处理
            </span>
          </div>
        </div>
      </div>

      {/* Quick sample image trials */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>没有准备图片？一键生成测试样本立即体验：</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadSample('landscape')}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors"
          >
            🏔️ 1080P 风景照
          </button>
          <button
            onClick={() => loadSample('portrait')}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors"
          >
            👤 证件人像源图
          </button>
          <button
            onClick={() => loadSample('ultra')}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors"
          >
            🖥️ 4K 超清图
          </button>
        </div>
      </div>
    </div>
  );
};
