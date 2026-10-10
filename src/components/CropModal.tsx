import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Check, Crop, RefreshCw } from 'lucide-react';
import type { CropArea } from '../types';

interface CropModalProps {
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  initialCrop?: CropArea;
  initialRotation: number;
  initialFlipH: boolean;
  initialFlipV: boolean;
  onApply: (params: {
    crop?: CropArea;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  }) => void;
  onClose: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  imageUrl,
  originalWidth,
  originalHeight,
  initialCrop,
  initialRotation,
  initialFlipH,
  initialFlipV,
  onApply,
  onClose,
}) => {
  const [rotation, setRotation] = useState(initialRotation);
  const [flipH, setFlipH] = useState(initialFlipH);
  const [flipV, setFlipV] = useState(initialFlipV);
  const [aspectRatio, setAspectRatio] = useState<number | 'free'>('free');

  // Canvas ref for displaying transformed image & crop rectangle
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 500, height: 400 });

  // Effective dimensions considering rotation
  const isRotated90 = rotation === 90 || rotation === 270;
  const currentW = isRotated90 ? originalHeight : originalWidth;
  const currentH = isRotated90 ? originalWidth : originalHeight;

  // Crop rectangle in pixels relative to current rotated dimensions
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>(() => {
    if (initialCrop) {
      return { ...initialCrop };
    }
    return {
      x: 0,
      y: 0,
      width: currentW,
      height: currentH,
    };
  });

  // Calculate container scale
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxW = rect.width - 32;
      const maxH = rect.height - 32;
      const scale = Math.min(maxW / currentW, maxH / currentH, 1);
      setDisplaySize({
        width: Math.round(currentW * scale),
        height: Math.round(currentH * scale),
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [currentW, currentH]);

  // Rotation changes reset or adjust crop box
  const handleRotate = (angleDelta: number) => {
    const nextRot = (rotation + angleDelta + 360) % 360;
    setRotation(nextRot);
    // Reset crop to full new dimensions
    const nextRotated90 = nextRot === 90 || nextRot === 270;
    const nw = nextRotated90 ? originalHeight : originalWidth;
    const nh = nextRotated90 ? originalWidth : originalHeight;
    setCropRect({ x: 0, y: 0, width: nw, height: nh });
  };

  // Dragging crop handles state
  const [dragState, setDragState] = useState<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | null;
    startX: number;
    startY: number;
    initialRect: typeof cropRect;
  }>({ type: null, startX: 0, startY: 0, initialRect: cropRect });

  const scale = displaySize.width / currentW || 1;

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

      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;
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
    [dragState, scale, currentW, currentH, aspectRatio]
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

  const handleApply = () => {
    const isFullImage =
      cropRect.x === 0 &&
      cropRect.y === 0 &&
      cropRect.width === currentW &&
      cropRect.height === currentH;

    onApply({
      crop: isFullImage ? undefined : cropRect,
      rotation,
      flipHorizontal: flipH,
      flipVertical: flipV,
    });
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white m-0">裁剪与旋转构图</h3>
            <p className="text-xs text-slate-400 m-0">
              当前选区：{cropRect.width} × {cropRect.height} px
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            应用修改
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative my-4 overflow-hidden select-none bg-slate-950/60 rounded-2xl border border-slate-800/60"
      >
        <div
          style={{
            width: displaySize.width,
            height: displaySize.height,
          }}
          className="relative shadow-2xl overflow-hidden"
        >
          {/* Rotated & Flipped Image Element */}
          <img
            src={imageUrl}
            alt="Source"
            draggable={false}
            style={{
              width: isRotated90 ? displaySize.height : displaySize.width,
              height: isRotated90 ? displaySize.width : displaySize.height,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
            className="pointer-events-none max-w-none"
          />

          {/* Dark Overlay outside crop rect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              border: '2px solid #6366f1',
            }}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Rule of thirds grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-white/50" />
              <div className="border-r border-white/50" />
              <div />
            </div>

            {/* Resize Handles */}
            <div
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
          </div>
        </div>
      </div>

      {/* Bottom Toolbars */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs">
        {/* Aspect Ratio Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">裁剪比例:</span>
          {[
            { label: '自由', value: 'free' },
            { label: '1 : 1', value: 1 },
            { label: '4 : 3', value: 4 / 3 },
            { label: '3 : 4', value: 3 / 4 },
            { label: '16 : 9', value: 16 / 9 },
            { label: '9 : 16', value: 9 / 16 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setRatio(item.value as any)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                aspectRatio === item.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Rotate & Flip Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRotate(-90)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="向左旋转 90 度"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            向左 90°
          </button>
          <button
            onClick={() => handleRotate(90)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="向右旋转 90 度"
          >
            <RotateCw className="w-3.5 h-3.5" />
            向右 90°
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setFlipH(!flipH)}
            className={`p-1.5 rounded-lg transition-colors ${
              flipH ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="水平镜像翻转"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFlipV(!flipV)}
            className={`p-1.5 rounded-lg transition-colors ${
              flipV ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="垂直镜像翻转"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setRotation(0);
              setFlipH(false);
              setFlipV(false);
              setAspectRatio('free');
              setCropRect({ x: 0, y: 0, width: originalWidth, height: originalHeight });
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="重置构图"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
