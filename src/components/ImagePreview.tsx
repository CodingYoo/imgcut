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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      {/* Top Bar Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[240px] sm:max-w-xs m-0">
              {image.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>原图: {formatDimensions(image.originalWidth, image.originalHeight)}</span>
              <span>•</span>
              <span className="font-mono">{formatBytes(image.originalSize)}</span>
            </div>
          </div>
        </div>

        {/* Comparison indicator & Crop action */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {image.processedSize && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">处理后:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatDimensions(
                  image.processedWidth || image.originalWidth,
                  image.processedHeight || image.originalHeight
                )}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-indigo-600 font-mono">
                {formatBytes(image.processedSize)}
              </span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[11px] font-bold ${
                  savings.saved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {savings.diffText}
              </span>
            </div>
          )}

          <button
            onClick={onOpenCrop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shrink-0"
            title="裁剪与旋转构图"
          >
            <Crop className="w-3.5 h-3.5 text-indigo-600" />
            <span>裁剪 / 旋转</span>
          </button>
        </div>
      </div>

      {/* Interactive Preview Canvas / Compare View */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] my-3 sm:my-4 rounded-xl overflow-hidden bg-slate-100/70 border border-slate-200 flex items-center justify-center select-none group">
        {/* Checkerboard Pattern for Alpha Channel */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-700">
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
          {image.processedUrl ? (
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              {/* Processed (After) Image */}
              <img
                src={image.processedUrl}
                alt="After"
                className="max-h-[320px] sm:max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain block pointer-events-none"
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
                  className="max-h-[320px] sm:max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain block"
                />
              </div>

              {/* Split Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                style={{ left: `${splitPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px]">
                  ⇄
                </div>
              </div>

              {/* Interactive range input */}
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
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium pointer-events-none z-10">
                原图
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-indigo-600/90 backdrop-blur-xs text-[10px] text-white font-medium pointer-events-none z-10">
                处理后
              </div>
            </div>
          ) : (
            <img
              src={currentDisplayUrl}
              alt="Preview"
              className="max-h-[320px] sm:max-h-[380px] lg:max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-md"
            />
          )}
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md text-slate-700 z-20">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 w-10 text-center font-semibold text-slate-800">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
            className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 1 && (
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[10px] px-1.5 py-0.5 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors text-slate-500 font-medium"
            >
              复位
            </button>
          )}
        </div>
      </div>

      {/* Bottom Export Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 order-2 sm:order-1 text-center sm:text-left">
          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>左右拖拽中央滑块可对比前后画质与体积</span>
        </div>

        {/* Action Buttons with guaranteed full text on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
          <button
            onClick={handleCopy}
            disabled={!image.processedBlob || isProcessing}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? '已复制到剪贴板' : '复制图像 (PNG)'}</span>
          </button>

          <button
            onClick={onDownload}
            disabled={!image.processedBlob || isProcessing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>保存下载调整后图片</span>
          </button>
        </div>
      </div>
    </div>
  );
};
