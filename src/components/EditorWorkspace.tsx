import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Download,
  MoreVertical,
  Crop,
  Maximize2,
  RefreshCw,
  Sliders,
  HardDrive,
  Palette,
  Droplet,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  FlipVertical,
  Check,
  Copy,
  Clock,
  Trash2,
  ZoomIn,
  Layers,
} from 'lucide-react';
import type {
  ImageItem,
  ResizeSettings,
  ActiveTool,
  OutputFormat,
  HistoryRecord,
} from '../types';
import { formatBytes, formatDimensions, getExtensionFromMime } from '../utils/formatters';
import { PRESETS } from '../utils/presets';

interface EditorWorkspaceProps {
  image: ImageItem;
  settings: ResizeSettings;
  onUpdateSettings: (settings: ResizeSettings) => void;
  onBack: () => void;
  onDownload: () => void;
  onBatchView: () => void;
  isProcessing: boolean;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  image,
  settings,
  onUpdateSettings,
  onBack,
  onDownload,
  onBatchView,
  isProcessing,
}) => {
  // Current active tool in left sidebar
  const [activeTool, setActiveTool] = useState<ActiveTool>('crop');
  
  // Right sidebar tab: 'base' | 'info' | 'history'
  const [rightTab, setRightTab] = useState<'base' | 'info' | 'history'>('base');

  // Zoom control: 0.5, 0.75, 1, 1.25, 1.5, 2
  const [zoom, setZoom] = useState<number>(1);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Accordion collapsed states
  const [collapseState, setCollapseState] = useState({
    dimensions: true,
    rotation: true,
    quality: true,
    format: true,
    filter: true,
    watermark: true,
  });

  const toggleCollapse = (key: keyof typeof collapseState) => {
    setCollapseState((s) => ({ ...s, [key]: !s[key] }));
  };

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

  // Calculate container scale
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxW = Math.max(300, rect.width - 64);
      const maxH = Math.max(200, rect.height - 100);
      const s = Math.min(maxW / currentW, maxH / currentH, 1);
      setDisplaySize({
        width: Math.round(currentW * s),
        height: Math.round(currentH * s),
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [currentW, currentH]);

  const scale = displaySize.width / currentW || 1;

  // Dragging crop handles
  const [dragState, setDragState] = useState<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | null;
    startX: number;
    startY: number;
    initialRect: typeof cropRect;
  }>({ type: null, startX: 0, startY: 0, initialRect: cropRect });

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect },
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
        newW = Math.max(50, Math.min(currentW - initialRect.x, initialRect.width + dx));
        newH = aspectRatio === 'free'
          ? Math.max(50, Math.min(currentH - initialRect.y, initialRect.height + dy))
          : Math.min(currentH - initialRect.y, newW / (aspectRatio as number));
        if (aspectRatio !== 'free') {
          newW = newH * (aspectRatio as number);
        }
      } else if (dragState.type === 'nw') {
        const potentialW = initialRect.width - dx;
        const potentialH = aspectRatio === 'free' ? initialRect.height - dy : potentialW / (aspectRatio as number);
        if (potentialW >= 50 && initialRect.x + dx >= 0) {
          newX = initialRect.x + dx;
          newW = potentialW;
        }
        if (potentialH >= 50 && initialRect.y + dy >= 0) {
          newY = initialRect.y + dy;
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

  const handleMouseUp = useCallback(() => {
    setDragState({ type: null, startX: 0, startY: 0, initialRect: cropRect });
  }, [cropRect]);

  useEffect(() => {
    if (dragState.type) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Apply Crop
  const handleApplyCrop = () => {
    const isFull =
      cropRect.x === 0 &&
      cropRect.y === 0 &&
      cropRect.width === currentW &&
      cropRect.height === currentH;

    const nextSettings: ResizeSettings = {
      ...settings,
      crop: isFull ? undefined : cropRect,
      width: Math.round(cropRect.width),
      height: Math.round(cropRect.height),
    };
    onUpdateSettings(nextSettings);
    pushHistory(nextSettings, `裁剪选区 ${cropRect.width} × ${cropRect.height}`);
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
    pushHistory(nextSettings, '重置裁剪构图');
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 select-none">
      {/* 1. Header Toolbar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Left: Brand + Back + Image Name & Metadata */}
        <div className="flex items-center gap-3">
          <div
            onClick={onBack}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            title="返回首页"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <span className="font-black text-xs">P</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 hidden sm:inline">
              PicScale
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="返回上传页面"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Filename & specs */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[140px] sm:max-w-xs">
              {image.name}
            </span>
            <span className="hidden md:inline-flex text-[11px] font-mono text-slate-400">
              {formatDimensions(image.originalWidth, image.originalHeight)} ·{' '}
              {formatBytes(image.originalSize)} ·{' '}
              {image.originalType.replace('image/', '').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right: Actions (Undo, Redo, Zoom, Fullscreen, Download, More) */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            title="撤销 (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            title="重做 (Redo)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Zoom Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
              <span>{Math.round(zoom * 100)}%</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isZoomDropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Sidebar (8 tools matching user's design) */}
        <aside className="w-28 sm:w-32 border-r border-slate-200 bg-white flex flex-col py-3 px-2 gap-1 shrink-0 overflow-y-auto">
          {[
            { id: 'crop', label: '裁剪', icon: Crop },
            { id: 'resize', label: '调整尺寸', icon: Maximize2 },
            { id: 'rotate', label: '旋转', icon: RefreshCw },
            { id: 'convert', label: '格式转换', icon: Sliders },
            { id: 'compress', label: '压缩', icon: HardDrive },
            { id: 'filter', label: '滤镜', icon: Palette },
            { id: 'watermark', label: '水印', icon: Droplet },
            { id: 'more', label: '更多工具', icon: MoreHorizontal },
          ].map((tool) => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as ActiveTool);
                  if (tool.id === 'resize') {
                    onUpdateSettings({ ...settings, mode: 'dimensions' });
                  } else if (tool.id === 'compress') {
                    onUpdateSettings({ ...settings, mode: 'target_size' });
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
          className="flex-1 relative flex flex-col items-center justify-center bg-[#eaeff5] overflow-hidden p-6 select-none"
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
              {/* Image element with rotation and flip */}
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
              {activeTool === 'crop' && (
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
              )}

              {/* Interactive Crop Box (Visible when Crop tool is active) */}
              {activeTool === 'crop' && (
                <div
                  style={{
                    position: 'absolute',
                    left: cropRect.x * scale,
                    top: cropRect.y * scale,
                    width: cropRect.width * scale,
                    height: cropRect.height * scale,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    border: '2px solid #ffffff',
                  }}
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
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
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-blue-600 rounded-sm cursor-nwse-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                  />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-blue-600 rounded-sm cursor-nesw-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-blue-600 rounded-sm cursor-nesw-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-blue-600 rounded-sm cursor-nwse-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Floating Canvas Bottom Toolbar (Exact match with user's design) */}
          <div className="absolute bottom-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-4 py-2.5 flex items-center justify-between gap-6 z-20 max-w-[92vw] overflow-x-auto">
            {/* Aspect Ratio Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">
                裁剪比例
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
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
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <button
                onClick={handleResetCrop}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>

              <button
                onClick={handleApplyCrop}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all whitespace-nowrap active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>应用</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Inspector / Settings Panel */}
        <aside className="w-72 sm:w-80 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto shadow-xs">
          {/* Top Panel Tabs (基础设置, 图片信息, 历史记录) */}
          <div className="border-b border-slate-200 px-4 flex items-center gap-6">
            <button
              onClick={() => setRightTab('base')}
              className={`relative py-3.5 text-xs font-bold transition-colors ${
                rightTab === 'base' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              基础设置
              {rightTab === 'base' && (
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

          {/* Panel Content based on selected tab */}
          <div className="p-4 flex flex-col gap-4">
            {rightTab === 'base' && (
              <>
                {/* Section 1: 裁剪与尺寸 (Collapsible) */}
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
                  <div
                    onClick={() => toggleCollapse('dimensions')}
                    className="p-3 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800">裁剪尺寸</span>
                    {collapseState.dimensions ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {collapseState.dimensions && (
                    <div className="p-3.5 flex flex-col gap-3">
                      {/* Preset Dropdown */}
                      <div>
                        <select
                          value={settings.selectedPresetId || 'custom'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              onUpdateSettings({ ...settings, selectedPresetId: undefined });
                            } else {
                              const found = PRESETS.find((p) => p.id === val);
                              if (found) {
                                onUpdateSettings({
                                  ...settings,
                                  selectedPresetId: found.id,
                                  width: found.width,
                                  height: found.height,
                                });
                              }
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer focus:border-blue-500 font-medium"
                        >
                          <option value="custom">自定义尺寸</option>
                          <optgroup label="常用证件照">
                            <option value="id_1_inch">标准 1 寸 (295 × 413)</option>
                            <option value="id_2_inch">标准 2 寸 (413 × 579)</option>
                            <option value="id_civil_servant">国考公务员 (295 × 413)</option>
                          </optgroup>
                          <optgroup label="社交媒体">
                            <option value="wechat_head">微信公众号首图 (900 × 383)</option>
                            <option value="xhs_cover">小红书 3:4 (1242 × 1660)</option>
                            <option value="bilibili_cover">B站 16:9 (1146 × 717)</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Width & Height Inputs */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="1"
                            value={settings.width}
                            onChange={(e) =>
                              onUpdateSettings({
                                ...settings,
                                width: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>
                        <span className="text-slate-400 text-xs">×</span>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="1"
                            value={settings.height}
                            onChange={(e) =>
                              onUpdateSettings({
                                ...settings,
                                height: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>
                        <span className="text-slate-400 text-xs font-mono">px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: 旋转角度 (Collapsible) */}
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
                  <div
                    onClick={() => toggleCollapse('rotation')}
                    className="p-3 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800">旋转角度</span>
                    {collapseState.rotation ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {collapseState.rotation && (
                    <div className="p-3.5 flex flex-col gap-3.5">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={settings.rotation}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              rotation: Number(e.target.value),
                            })
                          }
                          className="flex-1 accent-blue-600 cursor-pointer"
                        />
                        <span className="w-9 text-right text-xs font-mono font-semibold text-slate-700">
                          {settings.rotation}°
                        </span>
                      </div>

                      {/* 4 Rotation & Flip Buttons */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleRotate(-90)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                          title="逆时针旋转 90°"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRotate(90)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                          title="顺时针旋转 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onUpdateSettings({
                              ...settings,
                              flipHorizontal: !settings.flipHorizontal,
                            })
                          }
                          className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                            settings.flipHorizontal
                              ? 'bg-blue-50 border-blue-300 text-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title="水平镜像翻转"
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onUpdateSettings({
                              ...settings,
                              flipVertical: !settings.flipVertical,
                            })
                          }
                          className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                            settings.flipVertical
                              ? 'bg-blue-50 border-blue-300 text-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title="垂直镜像翻转"
                        >
                          <FlipVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: 画质与体积 (Collapsible) */}
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
                  <div
                    onClick={() => toggleCollapse('quality')}
                    className="p-3 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800">画质设置</span>
                    {collapseState.quality ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {collapseState.quality && (
                    <div className="p-3.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">图片质量</span>
                        <span className="font-mono font-bold text-blue-600">
                          {Math.round(settings.quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.quality}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            quality: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Section 4: 输出格式 (Collapsible) */}
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
                  <div
                    onClick={() => toggleCollapse('format')}
                    className="p-3 bg-slate-50/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800">输出格式</span>
                    {collapseState.format ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {collapseState.format && (
                    <div className="p-3.5">
                      <select
                        value={settings.format}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            format: e.target.value as OutputFormat,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer focus:border-blue-500 font-medium"
                      >
                        <option value="image/jpeg">JPG (兼容性佳 · 照片推荐)</option>
                        <option value="image/webp">WebP (高压缩率 · 现代格式)</option>
                        <option value="image/png">PNG (无损透明通道)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Section 5: 滤镜 (If filter tool is chosen) */}
                {activeTool === 'filter' && (
                  <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
                    <div className="p-3 bg-slate-50/70 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">色彩滤镜</span>
                    </div>
                    <div className="p-3.5 flex flex-col gap-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
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
                        <div className="flex justify-between mb-1">
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
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-500">黑白灰度</span>
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
                    </div>
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
    </div>
  );
};
