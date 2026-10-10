import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrandLogo } from './BrandLogo';
import {
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Download,
  MoreVertical,
  Crop,
  RefreshCw,
  Sliders,
  HardDrive,
  Palette,
  Droplet,
  MoreHorizontal,
  FlipHorizontal,
  FlipVertical,
  Check,
  Copy,
  Clock,
  Trash2,
  ZoomIn,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import type {
  ImageItem,
  ResizeSettings,
  ActiveTool,
  OutputFormat,
  HistoryRecord,
  FitMode,
} from '../types';
import { formatBytes, formatDimensions, getExtensionFromMime, calculateSavings } from '../utils/formatters';
import { PRESETS, PRESET_CATEGORIES } from '../utils/presets';

interface EditorWorkspaceProps {
  image: ImageItem;
  settings: ResizeSettings;
  onUpdateSettings: (settings: ResizeSettings) => void;
  onBack: () => void;
  onDownload: () => void;
  onBatchView: () => void;
  isProcessing: boolean;
  initialTool?: ActiveTool;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  image,
  settings,
  onUpdateSettings,
  onBack,
  onDownload,
  onBatchView,
  isProcessing,
  initialTool = 'crop',
}) => {
  // Current active tool in left sidebar
  const [activeTool, setActiveTool] = useState<ActiveTool>(initialTool || 'crop');
  const [cropResizeTab, setCropResizeTab] = useState<'crop' | 'resize'>('crop');
  
  // Track if we are actively editing the crop bounding box:
  // Defaults to false if image already has a crop (shows cropped result), true otherwise
  const [isCropping, setIsCropping] = useState<boolean>(!settings.crop);

  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool);
    }
  }, [initialTool]);
  
  // Right sidebar tab: 'tool' | 'info' | 'history'
  const [rightTab, setRightTab] = useState<'tool' | 'info' | 'history'>('tool');

  // Zoom control: 0.5, 0.75, 1, 1.25, 1.5, 2
  const [zoom, setZoom] = useState<number>(1);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resize submode in resize panel: 'dimensions' | 'percentage' | 'preset'
  const [resizeSubMode, setResizeSubMode] = useState<'dimensions' | 'percentage' | 'preset'>('dimensions');
  const [activePresetCategory, setActivePresetCategory] = useState<string>('id_photo');

  // Compress submode in compress panel: 'quality' | 'target_size'
  const [compressSubMode, setCompressSubMode] = useState<'quality' | 'target_size'>('quality');

  // Undo / Redo history stack
  const [history, setHistory] = useState<HistoryRecord[]>([
    {
      id: 'initial',
      timestamp: Date.now(),
      description: '加载原始图片',
      settings: { ...settings },
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newSettings: ResizeSettings, description: string) => {
    const record: HistoryRecord = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      description,
      settings: { ...newSettings },
    };
    const nextHistory = [...history.slice(0, historyIndex + 1), record];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdateSettings(prev.settings);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdateSettings(next.settings);
    }
  };

  // Crop Box state on Canvas
  const [aspectRatio, setAspectRatio] = useState<number | 'free'>('free');
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 600, height: 400 });

  const isRotated90 = settings.rotation === 90 || settings.rotation === 270;
  const currentW = isRotated90 ? image.originalHeight : image.originalWidth;
  const currentH = isRotated90 ? image.originalWidth : image.originalHeight;

  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>(() => {
    if (settings.crop) return { ...settings.crop };
    return { x: 0, y: 0, width: currentW, height: currentH };
  });

  // Keep cropRect in sync with settings.crop changes
  useEffect(() => {
    if (settings.crop) {
      setCropRect({ ...settings.crop });
    } else {
      setCropRect({ x: 0, y: 0, width: currentW, height: currentH });
      setIsCropping(true);
    }
  }, [settings.crop, currentW, currentH]);

  // Calculate container scale
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxW = Math.max(160, rect.width - 24);
      const maxH = Math.max(140, rect.height - 24);

      // When actively editing crop in crop tab, use the full uncropped dimensions
      // When viewing cropped result or in other tools/resize, use settings.crop dimensions
      const targetW = (isCropping && cropResizeTab === 'crop' && activeTool === 'crop')
        ? currentW
        : (settings.crop ? settings.crop.width : currentW);
      const targetH = (isCropping && cropResizeTab === 'crop' && activeTool === 'crop')
        ? currentH
        : (settings.crop ? settings.crop.height : currentH);

      const s = Math.min(maxW / targetW, maxH / targetH, 1);
      setDisplaySize({
        width: Math.round(targetW * s),
        height: Math.round(targetH * s),
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [currentW, currentH, isCropping, cropResizeTab, activeTool, settings.crop]);

  const scale = displaySize.width / currentW || 1;

  // Dragging crop handles with Pointer Events (supports mouse, stylus and mobile touch)
  const [dragState, setDragState] = useState<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | null;
    startX: number;
    startY: number;
    initialRect: typeof cropRect;
  }>({ type: null, startX: 0, startY: 0, initialRect: cropRect });

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDragState({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect },
    });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.type) return;

      const dx = (e.clientX - dragState.startX) / (scale * zoom);
      const dy = (e.clientY - dragState.startY) / (scale * zoom);
      const { initialRect } = dragState;

      let newX = initialRect.x;
      let newY = initialRect.y;
      let newW = initialRect.width;
      let newH = initialRect.height;

      if (dragState.type === 'move') {
        newX = Math.max(0, Math.min(currentW - newW, initialRect.x + dx));
        newY = Math.max(0, Math.min(currentH - newH, initialRect.y + dy));
      } else if (dragState.type === 'se') {
        newW = Math.max(40, Math.min(currentW - initialRect.x, initialRect.width + dx));
        newH = aspectRatio === 'free'
          ? Math.max(40, Math.min(currentH - initialRect.y, initialRect.height + dy))
          : Math.min(currentH - initialRect.y, newW / (aspectRatio as number));
        if (aspectRatio !== 'free') {
          newW = newH * (aspectRatio as number);
        }
      } else if (dragState.type === 'nw') {
        const potentialW = initialRect.width - dx;
        const potentialH = aspectRatio === 'free' ? initialRect.height - dy : potentialW / (aspectRatio as number);
        if (potentialW >= 40 && initialRect.x + dx >= 0) {
          newX = initialRect.x + dx;
          newW = potentialW;
        }
        if (potentialH >= 40 && initialRect.y + dy >= 0) {
          newY = initialRect.y + dy;
          newH = potentialH;
        }
      } else if (dragState.type === 'ne') {
        const potentialW = Math.max(40, Math.min(currentW - initialRect.x, initialRect.width + dx));
        const potentialH = aspectRatio === 'free' ? initialRect.height - dy : potentialW / (aspectRatio as number);
        if (potentialH >= 40 && initialRect.y + dy >= 0) {
          newY = initialRect.y + dy;
          newH = potentialH;
          newW = potentialW;
        }
      } else if (dragState.type === 'sw') {
        const potentialW = initialRect.width - dx;
        const potentialH = aspectRatio === 'free' ? Math.max(40, Math.min(currentH - initialRect.y, initialRect.height + dy)) : potentialW / (aspectRatio as number);
        if (potentialW >= 40 && initialRect.x + dx >= 0) {
          newX = initialRect.x + dx;
          newW = potentialW;
          newH = potentialH;
        }
      }

      setCropRect({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    },
    [dragState, scale, zoom, currentW, currentH, aspectRatio]
  );

  const handlePointerUp = useCallback(() => {
    setDragState({ type: null, startX: 0, startY: 0, initialRect: cropRect });
  }, [cropRect]);

  useEffect(() => {
    if (dragState.type) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [dragState, handlePointerMove, handlePointerUp]);

  // Apply Crop
  const handleApplyCrop = () => {
    const isFull =
      cropRect.x === 0 &&
      cropRect.y === 0 &&
      cropRect.width === currentW &&
      cropRect.height === currentH;

    const nextSettings: ResizeSettings = {
      ...settings,
      crop: isFull ? undefined : { ...cropRect },
      width: Math.round(cropRect.width),
      height: Math.round(cropRect.height),
    };
    onUpdateSettings(nextSettings);
    pushHistory(nextSettings, `裁剪选区 ${cropRect.width} × ${cropRect.height}`);
    setIsCropping(false);
  };

  const handleStartRecrop = () => {
    if (settings.crop) {
      setCropRect({ ...settings.crop });
    } else {
      setCropRect({ x: 0, y: 0, width: currentW, height: currentH });
    }
    setCropResizeTab('crop');
    setIsCropping(true);
  };

  const handleCancelRecrop = () => {
    if (settings.crop) {
      setCropRect({ ...settings.crop });
      setIsCropping(false);
    }
  };

  const handleResetCrop = () => {
    setCropRect({ x: 0, y: 0, width: currentW, height: currentH });
    setAspectRatio('free');
    const nextSettings: ResizeSettings = {
      ...settings,
      crop: undefined,
      width: currentW,
      height: currentH,
    };
    onUpdateSettings(nextSettings);
    pushHistory(nextSettings, '还原原图完整构图');
    setIsCropping(true);
  };

  const setRatio = (ratio: number | 'free') => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetW = currentW;
    let targetH = targetW / ratio;
    if (targetH > currentH) {
      targetH = currentH;
      targetW = targetH * ratio;
    }

    setCropRect({
      x: Math.round((currentW - targetW) / 2),
      y: Math.round((currentH - targetH) / 2),
      width: Math.round(targetW),
      height: Math.round(targetH),
    });
  };

  // Rotate & Flip
  const handleRotate = (angleDelta: number) => {
    const nextRot = (settings.rotation + angleDelta + 360) % 360;
    const nextSettings: ResizeSettings = {
      ...settings,
      rotation: nextRot,
    };
    onUpdateSettings(nextSettings);
    pushHistory(nextSettings, `旋转至 ${nextRot}°`);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!image.processedBlob) return;
    try {
      const c = document.createElement('canvas');
      const img = new Image();
      img.src = URL.createObjectURL(image.processedBlob);
      await new Promise((res) => (img.onload = res));
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      c.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch {
      alert('复制到剪贴板失败，请使用保存下载。');
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Calculate savings
  const savings = calculateSavings(
    image.originalSize,
    image.processedSize || image.originalSize
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 select-none">
      {/* 1. Header Toolbar */}
      <header className="h-14 border-b border-slate-200 bg-white px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Left: Brand + Back + Image Name & Metadata */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <BrandLogo size="sm" onClick={onBack} />

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            title="返回上传大厅"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Filename & specs */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs">
              {image.name}
            </span>
            <span className="hidden md:inline-flex text-[11px] font-mono text-slate-400 shrink-0">
              {formatDimensions(image.originalWidth, image.originalHeight)} ·{' '}
              {formatBytes(image.originalSize)} ·{' '}
              {image.originalType.replace('image/', '').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: Actions (Undo, Redo, Zoom, Fullscreen, Download, More) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            title="撤销 (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            title="重做 (Redo)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

          {/* Zoom Dropdown (hidden on small mobile screens) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
              <span>{Math.round(zoom * 100)}%</span>
            </button>

            {isZoomDropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs font-medium">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      setZoom(z);
                      setIsZoomDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${
                      zoom === z ? 'text-blue-600 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
            title="全屏切换"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Primary Download Button */}
          <button
            onClick={onDownload}
            disabled={!image.processedBlob || isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs font-medium">
                <button
                  onClick={() => {
                    handleCopy();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copied ? '已复制到剪贴板' : '复制图像 (PNG)'}</span>
                </button>
                <button
                  onClick={() => {
                    onBatchView();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>批量管理与打包 ZIP</span>
                </button>
                <button
                  onClick={() => {
                    handleResetCrop();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>重置所有修改</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Workspace Layout: Left Toolbar + Center Canvas + Right Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Tool Sidebar (Desktop Only - on mobile it becomes the bottom dock) */}
        <aside className="hidden lg:flex w-28 sm:w-32 border-r border-slate-200 bg-white flex-col py-3 px-2 gap-1 shrink-0 overflow-y-auto">
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
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as ActiveTool);
                  setRightTab('tool'); // switch inspector to tool settings
                  if (tool.id === 'crop') {
                    onUpdateSettings({ ...settings, mode: 'dimensions' });
                  } else if (tool.id === 'compress') {
                    onUpdateSettings({ ...settings, mode: compressSubMode === 'quality' ? 'dimensions' : 'target_size' });
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Center Canvas Workspace */}
        <main
          ref={containerRef}
          className="relative flex flex-col items-center justify-center bg-[#eaeff5] overflow-hidden select-none h-[42vh] lg:h-auto lg:flex-1 p-3 sm:p-6 shrink-0 lg:shrink"
        >
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Canvas Image Container with zoom scale */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.1s ease-out',
            }}
            className="relative shadow-2xl overflow-hidden rounded-lg bg-white"
          >
            <div
              style={{
                width: displaySize.width,
                height: displaySize.height,
              }}
              className="relative overflow-hidden"
            >
              {/* If actively editing crop: show uncropped source image with crop overlay & bounding box */}
              {activeTool === 'crop' && cropResizeTab === 'crop' && isCropping ? (
                <>
                  <img
                    src={image.previewUrl}
                    alt="Source"
                    draggable={false}
                    style={{
                      width: isRotated90 ? displaySize.height : displaySize.width,
                      height: isRotated90 ? displaySize.width : displaySize.height,
                      transform: `translate(-50%, -50%) rotate(${settings.rotation}deg) scale(${settings.flipHorizontal ? -1 : 1}, ${settings.flipVertical ? -1 : 1})`,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                    }}
                    className="pointer-events-none max-w-none block"
                  />

                  {/* Dark Overlay outside crop area */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Interactive Crop Box */}
                  <div
                    style={{
                      position: 'absolute',
                      left: cropRect.x * scale,
                      top: cropRect.y * scale,
                      width: cropRect.width * scale,
                      height: cropRect.height * scale,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      border: '2px solid #ffffff',
                      touchAction: 'none',
                    }}
                    className="cursor-move touch-none"
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                  >
                    {/* Rule of thirds grid lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                      <div className="border-r border-b border-white/70" />
                      <div className="border-r border-b border-white/70" />
                      <div className="border-b border-white/70" />
                      <div className="border-r border-b border-white/70" />
                      <div className="border-r border-b border-white/70" />
                      <div className="border-b border-white/70" />
                      <div className="border-r border-b border-white/70" />
                      <div className="border-r border-b border-white/70" />
                      <div />
                    </div>

                    {/* Corner & edge handles */}
                    <div
                      style={{ touchAction: 'none' }}
                      className="absolute -top-2 -left-2 w-4 h-4 sm:w-3.5 sm:h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow-md touch-none"
                      onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    />
                    <div
                      style={{ touchAction: 'none' }}
                      className="absolute -top-2 -right-2 w-4 h-4 sm:w-3.5 sm:h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow-md touch-none"
                      onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    />
                    <div
                      style={{ touchAction: 'none' }}
                      className="absolute -bottom-2 -left-2 w-4 h-4 sm:w-3.5 sm:h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow-md touch-none"
                      onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    />
                    <div
                      style={{ touchAction: 'none' }}
                      className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-3.5 sm:h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow-md touch-none"
                      onPointerDown={(e) => handlePointerDown(e, 'se')}
                    />
                  </div>
                </>
              ) : (
                /* Otherwise: display the clean processed / cropped image */
                <img
                  src={image.processedUrl || image.previewUrl}
                  alt="Processed preview"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none block"
                />
              )}
            </div>
          </div>

          {/* Floating Canvas Bottom Toolbar 1: When actively cropping */}
          {activeTool === 'crop' && cropResizeTab === 'crop' && isCropping && (
            <div className="absolute bottom-2 sm:bottom-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-6 z-20 max-w-[94vw] overflow-x-auto">
              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">
                  比例
                </span>
                {[
                  { label: '自由', value: 'free' },
                  { label: '1:1', value: 1 },
                  { label: '4:3', value: 4 / 3 },
                  { label: '16:9', value: 16 / 9 },
                  { label: '3:2', value: 3 / 2 },
                  { label: '2:3', value: 2 / 3 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setRatio(item.value as any)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      aspectRatio === item.value
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Reset & Apply Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-4 border-l border-slate-200">
                {settings.crop && (
                  <button
                    onClick={handleCancelRecrop}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors whitespace-nowrap"
                  >
                    取消
                  </button>
                )}
                <button
                  onClick={handleResetCrop}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">重置</span>
                </button>

                <button
                  onClick={handleApplyCrop}
                  className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all whitespace-nowrap active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>应用</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Canvas Bottom Toolbar 2: When image is cropped and viewing result */}
          {activeTool === 'crop' && cropResizeTab === 'crop' && !isCropping && settings.crop && (
            <div className="absolute bottom-2 sm:bottom-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 z-20 max-w-[94vw] overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>已裁剪: <strong className="font-mono text-blue-600 font-bold">{settings.crop.width} × {settings.crop.height} px</strong></span>
              </div>
              <div className="h-4 w-px bg-slate-200 shrink-0" />
              <button
                onClick={handleStartRecrop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>重新裁剪</span>
              </button>
              <button
                onClick={handleResetCrop}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>还原</span>
              </button>
            </div>
          )}
        </main>

        {/* Right Inspector / Settings Panel */}
        <aside className="flex-1 lg:flex-none lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col overflow-y-auto shadow-xs min-h-0">
          {/* Top Panel Tabs (操作设置, 图片信息, 历史记录) */}
          <div className="border-b border-slate-200 px-4 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setRightTab('tool')}
                className={`relative py-3.5 text-xs font-bold transition-colors ${
                  rightTab === 'tool' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {activeTool === 'crop' && '裁剪'}
                {activeTool === 'rotate' && '旋转'}
                {activeTool === 'convert' && '格式'}
                {activeTool === 'compress' && '压缩'}
                {activeTool === 'filter' && '滤镜'}
                {activeTool === 'watermark' && '水印'}
                {activeTool === 'more' && '更多'}
                {rightTab === 'tool' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setRightTab('info')}
                className={`relative py-3.5 text-xs font-bold transition-colors ${
                  rightTab === 'info' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                图片信息
                {rightTab === 'info' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setRightTab('history')}
                className={`relative py-3.5 text-xs font-bold transition-colors ${
                  rightTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                历史记录
                {rightTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Panel Content: ONLY shows relevant controls for the active tool! */}
          <div className="p-4 flex flex-col gap-4">
            {rightTab === 'tool' && (
              <>
                {/* UNIFIED TOOL: 裁剪 (Crop & Resize) */}
                {activeTool === 'crop' && (
                  <div className="flex flex-col gap-4">
                    {/* Sub-tab Switcher: 选区裁剪 vs 调整尺寸 */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => setCropResizeTab('crop')}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          cropResizeTab === 'crop'
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>选区裁剪</span>
                      </button>
                      <button
                        onClick={() => {
                          setCropResizeTab('resize');
                          setIsCropping(false);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          cropResizeTab === 'resize'
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>调整尺寸</span>
                      </button>
                    </div>

                    {/* Sub-tab 1: 选区裁剪 (Crop) */}
                    {cropResizeTab === 'crop' && (
                      <div className="flex flex-col gap-4">
                        {/* State A: Cropped view with Recrop & Reset actions */}
                        {!isCropping && settings.crop ? (
                          <div className="flex flex-col gap-3">
                            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  已应用裁剪
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-emerald-700">
                                  {settings.crop.width} × {settings.crop.height} px
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-600/90 leading-tight">
                                当前画布已呈现裁剪后效果。您可以直接导出，或随时点击重新裁剪微调范围。
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={handleStartRecrop}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                <Crop className="w-3.5 h-3.5" />
                                <span>重新裁剪</span>
                              </button>
                              <button
                                onClick={handleResetCrop}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>还原原图</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* State B: Active crop editing */
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <span>裁剪选区尺寸</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                原图: {currentW} × {currentH} px
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                  宽度 (Width)
                                </label>
                                <input
                                  type="number"
                                  value={cropRect.width}
                                  onChange={(e) =>
                                    setCropRect({ ...cropRect, width: Math.max(10, Number(e.target.value)) })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>
                              <span className="text-slate-400 text-xs mt-5">×</span>
                              <div className="flex-1">
                                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                  高度 (Height)
                                </label>
                                <input
                                  type="number"
                                  value={cropRect.height}
                                  onChange={(e) =>
                                    setCropRect({ ...cropRect, height: Math.max(10, Number(e.target.value)) })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>
                              <span className="text-slate-400 text-xs font-mono mt-5">px</span>
                            </div>

                            {/* Ratio shortcuts in right panel */}
                            <div>
                              <label className="text-[11px] font-medium text-slate-500 block mb-1.5">
                                常用比例预设:
                              </label>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[
                                  { label: '自由', value: 'free' },
                                  { label: '1:1 正方', value: 1 },
                                  { label: '4:3 标准', value: 4 / 3 },
                                  { label: '16:9 宽屏', value: 16 / 9 },
                                  { label: '3:2 相机', value: 3 / 2 },
                                  { label: '2:3 纵向', value: 2 / 3 },
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={() => setRatio(item.value as any)}
                                    className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                      aspectRatio === item.value
                                        ? 'bg-blue-50 text-blue-600 border-blue-300 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-blue-800 leading-relaxed">
                              💡 拖动中间画布上的白色虚线选区和四角把手，或在下方浮动条快速切换长宽比。
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {settings.crop && (
                                <button
                                  onClick={handleCancelRecrop}
                                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                                >
                                  取消
                                </button>
                              )}
                              <button
                                onClick={handleResetCrop}
                                className="flex-1 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                              >
                                重置选区
                              </button>
                              <button
                                onClick={handleApplyCrop}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                              >
                                确认应用
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 2: 调整尺寸 (Resize) */}
                    {cropResizeTab === 'resize' && (
                      <div className="flex flex-col gap-4">
                        {/* Live size feedback */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">当前预估文件体积:</span>
                          <span className="font-mono font-bold text-blue-600">
                            {image.processedSize ? formatBytes(image.processedSize) : '计算中...'}
                          </span>
                        </div>

                        {/* Submodes: Dimensions vs Percentage vs Presets */}
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                          {[
                            { id: 'dimensions', label: '精确像素' },
                            { id: 'percentage', label: '百分比' },
                            { id: 'preset', label: '规格预设' },
                          ].map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setResizeSubMode(sub.id as any)}
                              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                resizeSubMode === sub.id
                                  ? 'bg-white text-blue-600 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>

                        {/* Mode A: 精确像素 */}
                        {resizeSubMode === 'dimensions' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                  宽度 (Width)
                                </label>
                                <input
                                  type="number"
                                  value={settings.width}
                                  onChange={(e) => {
                                    const w = Math.max(1, Number(e.target.value));
                                    let h = settings.height;
                                    if (settings.lockAspectRatio && currentW > 0) {
                                      h = Math.round(w * (currentH / currentW));
                                    }
                                    onUpdateSettings({ ...settings, width: w, height: h });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>
                              <span className="text-slate-400 text-xs mt-5">×</span>
                              <div className="flex-1">
                                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                  高度 (Height)
                                </label>
                                <input
                                  type="number"
                                  value={settings.height}
                                  onChange={(e) => {
                                    const h = Math.max(1, Number(e.target.value));
                                    let w = settings.width;
                                    if (settings.lockAspectRatio && currentH > 0) {
                                      w = Math.round(h * (currentW / currentH));
                                    }
                                    onUpdateSettings({ ...settings, width: w, height: h });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>
                              <span className="text-slate-400 text-xs font-mono mt-5">px</span>
                            </div>

                            {/* Lock ratio */}
                            <button
                              onClick={() =>
                                onUpdateSettings({ ...settings, lockAspectRatio: !settings.lockAspectRatio })
                              }
                              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                settings.lockAspectRatio
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {settings.lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              <span>锁定等比例缩放</span>
                            </button>

                            {/* Fit mode */}
                            <div className="flex flex-col gap-1 pt-1">
                              <label className="text-[11px] font-medium text-slate-500">
                                缩放适配模式:
                              </label>
                              <select
                                value={settings.fitMode}
                                onChange={(e) =>
                                  onUpdateSettings({ ...settings, fitMode: e.target.value as FitMode })
                                }
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none font-medium focus:border-blue-500"
                              >
                                <option value="inside">按最大边自适应包含 (Inside)</option>
                                <option value="cover">居中裁切填满 (Cover)</option>
                                <option value="contain">等比留白完整包含 (Contain)</option>
                                <option value="stretch">强制拉伸填充 (Stretch)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Mode B: 百分比 */}
                        {resizeSubMode === 'percentage' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">缩放比例</span>
                              <span className="font-mono font-bold text-blue-600">{settings.percentage}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="200"
                              step="5"
                              value={settings.percentage}
                              onChange={(e) =>
                                onUpdateSettings({
                                  ...settings,
                                  percentage: Number(e.target.value),
                                  width: Math.round((currentW * Number(e.target.value)) / 100),
                                  height: Math.round((currentH * Number(e.target.value)) / 100),
                                })
                              }
                              className="w-full accent-blue-600"
                            />
                            <div className="grid grid-cols-3 gap-1.5">
                              {[25, 50, 75, 100, 150, 200].map((p) => (
                                <button
                                  key={p}
                                  onClick={() =>
                                    onUpdateSettings({
                                      ...settings,
                                      percentage: p,
                                      width: Math.round((currentW * p) / 100),
                                      height: Math.round((currentH * p) / 100),
                                    })
                                  }
                                  className={`py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                                    settings.percentage === p
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mode C: 规格预设 */}
                        {resizeSubMode === 'preset' && (
                          <div className="flex flex-col gap-2.5">
                            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                              {PRESET_CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => setActivePresetCategory(cat.id)}
                                  className={`py-1 text-[11px] font-semibold rounded ${
                                    activePresetCategory === cat.id
                                      ? 'bg-white text-blue-600 shadow-xs'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {PRESETS.filter((p) => p.category === activePresetCategory).map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => {
                                    onUpdateSettings({
                                      ...settings,
                                      selectedPresetId: preset.id,
                                      width: preset.width,
                                      height: preset.height,
                                    });
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                                    settings.selectedPresetId === preset.id
                                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold">{preset.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {preset.width} × {preset.height} px
                                    </div>
                                  </div>
                                  {preset.badge && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">
                                      {preset.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 3: 旋转 (Rotate) */}
                {activeTool === 'rotate' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">任意旋转角度</span>
                      <span className="font-mono font-bold text-blue-600">{settings.rotation}°</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={settings.rotation}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, rotation: Number(e.target.value) })
                      }
                      className="w-full accent-blue-600"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleRotate(-90)}
                        className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>逆时针 90°</span>
                      </button>
                      <button
                        onClick={() => handleRotate(90)}
                        className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>顺时针 90°</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          onUpdateSettings({ ...settings, flipHorizontal: !settings.flipHorizontal })
                        }
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                          settings.flipHorizontal
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>水平翻转</span>
                      </button>
                      <button
                        onClick={() =>
                          onUpdateSettings({ ...settings, flipVertical: !settings.flipVertical })
                        }
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                          settings.flipVertical
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>垂直翻转</span>
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        onUpdateSettings({ ...settings, rotation: 0, flipHorizontal: false, flipVertical: false })
                      }
                      className="py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      重置旋转与镜像
                    </button>
                  </div>
                )}

                {/* TOOL 4: 格式转换 (Convert) */}
                {activeTool === 'convert' && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-700">选择目标导出格式:</span>

                    {[
                      { id: 'image/jpeg', name: 'JPEG (JPG)', desc: '通用照片格式 · 兼容各大社交平台与考务系统' },
                      { id: 'image/webp', name: 'WebP', desc: '现代格式 · 极高压缩率 · 推荐网站使用' },
                      { id: 'image/png', name: 'PNG', desc: '高清无损 · 完美支持 Alpha 透明通道' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() =>
                          onUpdateSettings({ ...settings, format: fmt.id as OutputFormat })
                        }
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          settings.format === fmt.id
                            ? 'bg-blue-50/80 border-blue-500 text-slate-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{fmt.name}</span>
                          {settings.format === fmt.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 m-0 leading-normal">{fmt.desc}</p>
                      </button>
                    ))}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center mt-2">
                      <span className="text-slate-500">转换后大小:</span>
                      <span className="font-mono font-bold text-blue-600">
                        {image.processedSize ? formatBytes(image.processedSize) : '计算中...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* TOOL 5: 压缩 (Compress) - ★ KEY FEATURE: LIVE FILE SIZE IN KB */}
                {activeTool === 'compress' && (
                  <div className="flex flex-col gap-4">
                    {/* Real-time File Size Indicator (Prominent Banner) */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
                        <span>调整后图片大小</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-bold">
                          {savings.diffText}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-blue-600">
                          {image.processedSize ? formatBytes(image.processedSize) : '计算中...'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          (原图: {formatBytes(image.originalSize)})
                        </span>
                      </div>
                      {isProcessing && (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>正在实时压缩并计算大小...</span>
                        </div>
                      )}
                    </div>

                    {/* Submode Switcher */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => {
                          setCompressSubMode('quality');
                          onUpdateSettings({ ...settings, mode: 'dimensions' });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          compressSubMode === 'quality'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        按图片质量滑块
                      </button>
                      <button
                        onClick={() => {
                          setCompressSubMode('target_size');
                          onUpdateSettings({ ...settings, mode: 'target_size' });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          compressSubMode === 'target_size'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        限制目标体积 (KB)
                      </button>
                    </div>

                    {/* Mode A: Quality Slider with Immediate KB reflection */}
                    {compressSubMode === 'quality' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">质量比例 (Quality)</span>
                          <span className="font-mono font-bold text-blue-600 text-sm">
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
                            onUpdateSettings({
                              ...settings,
                              mode: 'dimensions',
                              quality: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600 cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>小体积 (较模糊)</span>
                          <span>平衡 (推荐 85%)</span>
                          <span>近无损</span>
                        </div>

                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed m-0">
                          💡 拖动上方滑块时，顶部将实时计算并显示图片导出后的具体 KB 数值。
                        </p>
                      </div>
                    )}

                    {/* Mode B: Target Size (KB) */}
                    {compressSubMode === 'target_size' && (
                      <div className="flex flex-col gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                            指定目标体积上限 (KB)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="5"
                              max="10000"
                              value={settings.targetSizeKB}
                              onChange={(e) =>
                                onUpdateSettings({
                                  ...settings,
                                  mode: 'target_size',
                                  targetSizeKB: Math.max(5, Number(e.target.value)),
                                })
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                              KB
                            </span>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: '公考 ≤20K', kb: 20 },
                            { label: '国考 ≤50K', kb: 50 },
                            { label: '教资 ≤100K', kb: 100 },
                            { label: '标准 ≤200K', kb: 200 },
                            { label: '高清 ≤500K', kb: 500 },
                            { label: '网页 ≤1MB', kb: 1024 },
                          ].map((item) => (
                            <button
                              key={item.kb}
                              onClick={() =>
                                onUpdateSettings({
                                  ...settings,
                                  mode: 'target_size',
                                  targetSizeKB: item.kb,
                                })
                              }
                              className={`py-1.5 px-1 rounded-lg text-xs font-medium border text-center transition-all ${
                                settings.targetSizeKB === item.kb
                                  ? 'bg-blue-600 border-blue-600 text-white font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed m-0">
                          💡 浏览器本地将执行多次二分逼近搜索，自动调整压缩比并确保输出绝对不超过目标体积。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 6: 滤镜 (Filter) */}
                {activeTool === 'filter' && (
                  <div className="flex flex-col gap-3.5">
                    <span className="text-xs font-bold text-slate-800">色彩与滤镜调节</span>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">亮度</span>
                        <span className="font-mono">{settings.filters.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={settings.filters.brightness}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            filters: { ...settings.filters, brightness: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">对比度</span>
                        <span className="font-mono">{settings.filters.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={settings.filters.contrast}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            filters: { ...settings.filters, contrast: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">饱和度</span>
                        <span className="font-mono">{settings.filters.saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={settings.filters.saturation}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            filters: { ...settings.filters, saturation: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">黑白 / 灰度</span>
                        <span className="font-mono">{settings.filters.grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.filters.grayscale}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            filters: { ...settings.filters, grayscale: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0 },
                        })
                      }
                      className="py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors mt-2"
                    >
                      重置所有滤镜
                    </button>
                  </div>
                )}

                {/* TOOL 7: 水印 (Watermark) */}
                {activeTool === 'watermark' && (
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">启用水印</span>
                      <input
                        type="checkbox"
                        checked={settings.watermark.enabled}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            watermark: { ...settings.watermark, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {settings.watermark.enabled && (
                      <div className="flex flex-col gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 block mb-1">
                            水印文字内容
                          </label>
                          <input
                            type="text"
                            value={settings.watermark.text}
                            onChange={(e) =>
                              onUpdateSettings({
                                ...settings,
                                watermark: { ...settings.watermark, text: e.target.value },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">透明度</span>
                            <span className="font-mono">{Math.round(settings.watermark.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={settings.watermark.opacity}
                            onChange={(e) =>
                              onUpdateSettings({
                                ...settings,
                                watermark: { ...settings.watermark, opacity: parseFloat(e.target.value) },
                              })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-500">水印位置</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'center', label: '正中央' },
                              { id: 'bottom-right', label: '右下角' },
                              { id: 'bottom-left', label: '左下角' },
                              { id: 'top-right', label: '右上角' },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                onClick={() =>
                                  onUpdateSettings({
                                    ...settings,
                                    watermark: { ...settings.watermark, position: pos.id as any },
                                  })
                                }
                                className={`py-1.5 rounded-lg text-xs font-semibold border ${
                                  settings.watermark.position === pos.id
                                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 8: 更多工具 (More) */}
                {activeTool === 'more' && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-800">快捷操作与管理</span>
                    <button
                      onClick={onBatchView}
                      className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>打开批量处理队列管理</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>{copied ? '已复制 PNG 到剪贴板' : '复制 PNG 图像'}</span>
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Maximize className="w-4 h-4 text-slate-400" />
                      <span>全屏沉浸编辑</span>
                    </button>
                    <button
                      onClick={handleResetCrop}
                      className="p-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-semibold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>恢复原始图片状态</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Tab 2: 图片信息 */}
            {rightTab === 'info' && (
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">文件名称</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                      {image.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">原始尺寸</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatDimensions(image.originalWidth, image.originalHeight)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">原始体积</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatBytes(image.originalSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">原始格式</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {image.originalType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {image.processedSize && (
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">处理后尺寸</span>
                      <span className="font-mono font-bold text-blue-900">
                        {formatDimensions(
                          image.processedWidth || settings.width,
                          image.processedHeight || settings.height
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">处理后体积</span>
                      <span className="font-mono font-bold text-blue-900">
                        {formatBytes(image.processedSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">导出格式</span>
                      <span className="font-mono font-bold text-blue-900">
                        {getExtensionFromMime(settings.format).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: 历史记录 */}
            {rightTab === 'history' && (
              <div className="flex flex-col gap-2 text-xs">
                {history.map((rec, index) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setHistoryIndex(index);
                      onUpdateSettings(rec.settings);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      historyIndex === index
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rec.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rec.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 3. Mobile Bottom Dock (7 tools: 裁剪, 旋转, 格式, 压缩, 滤镜, 水印, 更多) */}
      <nav className="lg:hidden border-t border-slate-200 bg-white shrink-0 px-1 py-1 flex items-center justify-around z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
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
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id as ActiveTool);
                setRightTab('tool');
                if (tool.id === 'crop') {
                  onUpdateSettings({ ...settings, mode: 'dimensions' });
                } else if (tool.id === 'compress') {
                  onUpdateSettings({ ...settings, mode: compressSubMode === 'quality' ? 'dimensions' : 'target_size' });
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="text-[10px] leading-tight">{tool.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
