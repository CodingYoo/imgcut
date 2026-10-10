import React, { useState } from 'react';
import { Download, Copy, Check, Crop, ArrowRight, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { ImageItem } from '../types';
import { formatBytes, formatDimensions, calculateSavings } from '../utils/formatters';

interface ImagePreviewProps {
  image: ImageItem;
  onOpenCrop: () => void;
  onDownload: () => void;
  isProcessing: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onOpenCrop,
  onDownload,
  isProcessing,
}) => {
  const [splitPosition, setSplitPosition] = useState(50); // 0 to 100%
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const savings = calculateSavings(
    image.originalSize,
    image.processedSize || image.originalSize
  );

  const handleCopy = async () => {
    if (!image.processedBlob) return;
    try {
      // Browsers generally only support image/png in clipboard
      const pngBlob =
        image.processedBlob.type === 'image/png'
          ? image.processedBlob
          : await convertBlobToPng(image.processedBlob);

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
      alert('复制到剪贴板失败，您的浏览器可能限制非 PNG 格式或缺少权限。');
    }
  };

  const convertBlobToPng = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('转换 PNG 失败'))), 'image/png');
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  const currentDisplayUrl = image.processedUrl || image.previewUrl;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl">
      {/* Top Bar Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs m-0">
              {image.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>原图: {formatDimensions(image.originalWidth, image.originalHeight)}</span>
              <span>•</span>
              <span>{formatBytes(image.originalSize)}</span>
            </div>
          </div>
        </div>

        {/* Comparison indicator */}
        <div className="flex items-center gap-3">
          {image.processedSize && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">处理后:</span>
              <span className="font-semibold text-white">
                {formatDimensions(
                  image.processedWidth || image.originalWidth,
                  image.processedHeight || image.originalHeight
                )}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-semibold text-indigo-400">
                {formatBytes(image.processedSize)}
              </span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  savings.saved
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {savings.diffText}
              </span>
            </div>
          )}

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCrop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              title="裁剪与旋转构图"
            >
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              <span>裁剪/旋转</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Preview Canvas / Compare View */}
      <div className="relative flex-1 min-h-[350px] lg:min-h-[440px] my-4 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 flex items-center justify-center select-none group">
        {/* Checkerboard Pattern for Alpha Channel / Transparency */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-200">
              渲染与优化处理中...
            </span>
          </div>
        )}

        {/* Zoomed Container */}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center p-2"
        >
          {/* If processed URL is ready, show split comparison slider */}
          {image.processedUrl ? (
            <div className="relative overflow-hidden rounded-lg shadow-2xl">
              {/* Processed (After) Image */}
              <img
                src={image.processedUrl}
                alt="After"
                className="max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain block pointer-events-none"
              />

              {/* Original (Before) Image with clip-path */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
                }}
              >
                <img
                  src={image.previewUrl}
                  alt="Before"
                  className="max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain block"
                />
              </div>

              {/* Split Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: `${splitPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px]">
                  ⇄
                </div>
              </div>

              {/* Invisible interactive range input for slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                title="拖拽左右对比效果"
              />

              {/* Labels */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium pointer-events-none z-10">
                原图
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-indigo-600/80 backdrop-blur-sm text-[10px] text-white font-medium pointer-events-none z-10">
                处理后
              </div>
            </div>
          ) : (
            <img
              src={currentDisplayUrl}
              alt="Preview"
              className="max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-slate-300 z-20">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            className="p-1 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
            className="p-1 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 1 && (
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[10px] px-1.5 py-0.5 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            >
              复位
            </button>
          )}
        </div>
      </div>

      {/* Bottom Export Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span>支持实时拖拽中央滑块查看前后画质与细节对比</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleCopy}
            disabled={!image.processedBlob || isProcessing}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              copied
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制到剪贴板' : '复制图像 (PNG)'}</span>
          </button>

          <button
            onClick={onDownload}
            disabled={!image.processedBlob || isProcessing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="w-4 h-4" />
            <span>保存下载调整后图片</span>
          </button>
        </div>
      </div>
    </div>
  );
};
