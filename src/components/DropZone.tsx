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

  const loadSample = (type: 'mountain' | 'sunset' | 'cat' | 'leaf' | 'city') => {
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
            ? 'border-indigo-500 bg-indigo-50/70'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30'
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
        <div className="flex items-center justify-center gap-2 text-xs text-slate-700 font-medium">
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          <span>点击或拖入更多图片继续添加</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-14 text-center cursor-pointer transition-all duration-300 group ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01] shadow-xl shadow-indigo-500/10'
            : 'border-slate-300/90 hover:border-indigo-400 bg-white hover:bg-slate-50/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
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

        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 sm:mb-6 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-100/70 transition-all duration-300 shadow-sm">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
            点击上传或将图片拖拽至此处
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 sm:mb-6 leading-relaxed px-2">
            支持 JPG、PNG、WebP、GIF、BMP 等格式。支持多图批量上传或截图后直接
            <kbd className="mx-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold shadow-xs">
              Ctrl + V
            </kbd>
            粘贴。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 whitespace-nowrap">
              <Clipboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>支持剪贴板粘贴</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 whitespace-nowrap">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>支持批量多选</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>浏览器离线处理</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick sample image trials */}
      <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 text-center sm:text-left">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>没有准备图片？一键生成测试样本立即体验：</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => loadSample('mountain')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-all shadow-xs hover:border-slate-300 whitespace-nowrap"
          >
            🏔️ 湖泊雪山
          </button>
          <button
            onClick={() => loadSample('sunset')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-all shadow-xs hover:border-slate-300 whitespace-nowrap"
          >
            🌅 金色落日
          </button>
          <button
            onClick={() => loadSample('cat')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-all shadow-xs hover:border-slate-300 whitespace-nowrap"
          >
            🐱 可爱猫咪
          </button>
        </div>
      </div>
    </div>
  );
};
