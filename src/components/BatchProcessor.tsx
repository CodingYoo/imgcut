import React, { useState } from 'react';
import {
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ImageItem, ResizeSettings } from '../types';
import { formatBytes, formatDimensions, calculateSavings, getExtensionFromMime } from '../utils/formatters';
import { processImage } from '../utils/imageProcess';
import { DropZone } from './DropZone';

interface BatchProcessorProps {
  images: ImageItem[];
  settings: ResizeSettings;
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onRemoveImage: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  onSelectForSingleEdit: (image: ImageItem) => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  images,
  settings,
  onUpdateImage,
  onRemoveImage,
  onAddFiles,
  onSelectForSingleEdit,
}) => {
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Process all images sequentially/concurrently
  const handleProcessAll = async () => {
    if (images.length === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    setProgress({ current: 0, total: images.length });

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      onUpdateImage(img.id, { status: 'processing' });

      try {
        const result = await processImage(img.file, settings);
        const url = URL.createObjectURL(result.blob);

        onUpdateImage(img.id, {
          status: 'done',
          processedBlob: result.blob,
          processedUrl: url,
          processedWidth: result.width,
          processedHeight: result.height,
          processedSize: result.size,
        });
      } catch (err: any) {
        onUpdateImage(img.id, {
          status: 'error',
          errorMessage: err.message || '处理失败',
        });
      }

      setProgress({ current: i + 1, total: images.length });
    }

    setIsBatchProcessing(false);
  };

  // Package all completed images into a ZIP file
  const handleDownloadZip = async () => {
    const completedItems = images.filter((img) => img.processedBlob && img.status === 'done');
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const ext = getExtensionFromMime(settings.format);

      completedItems.forEach((img, idx) => {
        const baseName = img.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_resized_${idx + 1}.${ext}`;
        zip.file(filename, img.processedBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `picscale_batch_${Date.now()}.zip`);
    } catch (err) {
      console.error('Packaging zip failed:', err);
      alert('打包压缩包失败，请检查浏览器内存是否充足。');
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = images.filter((i) => i.status === 'done').length;
  const totalOriginalBytes = images.reduce((acc, cur) => acc + cur.originalSize, 0);
  const totalProcessedBytes = images.reduce(
    (acc, cur) => acc + (cur.processedSize || cur.originalSize),
    0
  );
  const totalSavings = calculateSavings(totalOriginalBytes, totalProcessedBytes);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Batch Summary Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white m-0">批量处理队列</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>共 {images.length} 张图片</span>
              <span>•</span>
              <span>已处理 {completedCount} 张</span>
              {completedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    总减小 {totalSavings.diffText}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleProcessAll}
            disabled={isBatchProcessing || images.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isBatchProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  处理中 ({progress.current}/{progress.total})...
                </span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>批量一键处理全部</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={completedCount === 0 || isZipping}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>打包生成中...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>打包下载 ZIP ({completedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Images List Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">图片缩略图与名称</th>
                <th className="py-3 px-4">原始尺寸与体积</th>
                <th className="py-3 px-4">处理后尺寸与体积</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {images.map((item) => {
                const saving = calculateSavings(
                  item.originalSize,
                  item.processedSize || item.originalSize
                );

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Thumbnail & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.processedUrl || item.previewUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-xs m-0">
                            {item.name}
                          </p>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {item.originalType.replace('image/', '').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Original info */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-mono">
                        {formatDimensions(item.originalWidth, item.originalHeight)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatBytes(item.originalSize)}
                      </div>
                    </td>

                    {/* Processed info */}
                    <td className="py-3 px-4">
                      {item.processedWidth && item.processedSize ? (
                        <div>
                          <div className="font-mono text-indigo-400 font-medium">
                            {formatDimensions(
                              item.processedWidth,
                              item.processedHeight || item.processedWidth
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-300 font-mono">
                              {formatBytes(item.processedSize)}
                            </span>
                            <span
                              className={`text-[10px] px-1 rounded font-bold ${
                                saving.saved
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {saving.diffText}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {item.status === 'done' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium text-[11px]">
                          <CheckCircle className="w-3 h-3" />
                          已就绪
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium text-[11px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          处理中
                        </span>
                      )}
                      {item.status === 'idle' && (
                        <span className="inline-flex items-center text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                          待处理
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-medium text-[11px]">
                          <AlertCircle className="w-3 h-3" />
                          失败
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectForSingleEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
                          title="在单图模式中精调"
                        >
                          精调
                        </button>

                        {item.processedBlob && (
                          <button
                            onClick={() => {
                              const ext = getExtensionFromMime(settings.format);
                              const base = item.name.replace(/\.[^/.]+$/, '');
                              saveAs(item.processedBlob!, `${base}_resized.${ext}`);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                            title="单独下载此图片"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onRemoveImage(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="移除图片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Drop zone to add more */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <DropZone onFilesSelected={onAddFiles} compact />
        </div>
      </div>
    </div>
  );
};
