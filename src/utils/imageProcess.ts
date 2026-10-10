import type { ResizeSettings, FitMode, OutputFormat } from '../types';

/**
 * Loads an image from File or URL into an HTMLImageElement
 */
export function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve(img);
    };

    img.onerror = (err) => {
      reject(new Error('无法加载该图片，可能格式不受支持或文件已损坏。' + err));
    };

    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * Multi-step downsampling for smooth, anti-aliased high quality scaling
 */
function drawHighQualityDownscale(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  sourceX = 0,
  sourceY = 0,
  sourceW = (sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width),
  sourceH = (sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height)
): HTMLCanvasElement {
  let curW = sourceW;
  let curH = sourceH;

  // Temporary canvas
  let currentCanvas: HTMLCanvasElement = document.createElement('canvas');
  currentCanvas.width = curW;
  currentCanvas.height = curH;
  let ctx = currentCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Initial draw of cropped/selected area
  ctx.drawImage(
    sourceCanvas,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, curW, curH
  );

  // If we are downscaling by more than 2x, do step-down halves
  while (curW / 2 > targetWidth && curH / 2 > targetHeight) {
    const nextW = Math.floor(curW / 2);
    const nextH = Math.floor(curH / 2);

    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = nextW;
    nextCanvas.height = nextH;
    const nextCtx = nextCanvas.getContext('2d')!;
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';

    nextCtx.drawImage(currentCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);

    currentCanvas = nextCanvas;
    curW = nextW;
    curH = nextH;
  }

  // Final draw to exact target dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(currentCanvas, 0, 0, curW, curH, 0, 0, targetWidth, targetHeight);

  return finalCanvas;
}

/**
 * Compute target dimensions based on settings and source aspect ratio
 */
export function calculateTargetDimensions(
  origW: number,
  origH: number,
  settings: ResizeSettings
): { width: number; height: number } {
  switch (settings.mode) {
    case 'percentage': {
      const scale = Math.max(1, settings.percentage) / 100;
      return {
        width: Math.max(1, Math.round(origW * scale)),
        height: Math.max(1, Math.round(origH * scale)),
      };
    }
    case 'target_size':
    case 'dimensions':
    case 'preset':
    default: {
      return {
        width: Math.max(1, Math.round(settings.width)),
        height: Math.max(1, Math.round(settings.height)),
      };
    }
  }
}

/**
 * Transforms an image (Rotation + Flip + Crop) into an intermediate Canvas
 */
function applyTransformations(
  img: HTMLImageElement,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  crop?: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const initialW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const initialH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = initialW;
  canvas.height = initialH;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  ctx.translate(initialW / 2, initialH / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  ctx.drawImage(
    img,
    -img.naturalWidth / 2,
    -img.naturalHeight / 2,
    img.naturalWidth,
    img.naturalHeight
  );
  ctx.restore();

  // If crop is requested, extract crop area
  if (crop && crop.width > 0 && crop.height > 0) {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = Math.round(crop.width);
    croppedCanvas.height = Math.round(crop.height);
    const croppedCtx = croppedCanvas.getContext('2d')!;

    croppedCtx.drawImage(
      canvas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );
    return croppedCanvas;
  }

  return canvas;
}

/**
 * Render image onto target dimensions using selected FitMode
 */
function renderWithFitMode(
  transformedCanvas: HTMLCanvasElement,
  targetW: number,
  targetH: number,
  fitMode: FitMode,
  fillColor: string,
  outputFormat: OutputFormat
): HTMLCanvasElement {
  const srcW = transformedCanvas.width;
  const srcH = transformedCanvas.height;

  if (fitMode === 'inside') {
    // Scales to fit within targetW and targetH preserving aspect ratio, no padding
    const ratio = Math.min(targetW / srcW, targetH / srcH);
    const finalW = Math.max(1, Math.round(srcW * ratio));
    const finalH = Math.max(1, Math.round(srcH * ratio));
    return drawHighQualityDownscale(transformedCanvas, finalW, finalH);
  }

  if (fitMode === 'stretch') {
    return drawHighQualityDownscale(transformedCanvas, targetW, targetH);
  }

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = targetW;
  resultCanvas.height = targetH;
  const ctx = resultCanvas.getContext('2d')!;

  // Background for JPEG or contain padding
  if (outputFormat === 'image/jpeg' || (fitMode === 'contain' && fillColor)) {
    ctx.fillStyle = fillColor || '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  if (fitMode === 'contain') {
    // Preserve aspect ratio, letterbox padding
    const ratio = Math.min(targetW / srcW, targetH / srcH);
    const scaledW = Math.max(1, Math.round(srcW * ratio));
    const scaledH = Math.max(1, Math.round(srcH * ratio));
    const offsetX = Math.round((targetW - scaledW) / 2);
    const offsetY = Math.round((targetH - scaledH) / 2);

    const scaled = drawHighQualityDownscale(transformedCanvas, scaledW, scaledH);
    ctx.drawImage(scaled, offsetX, offsetY);
  } else if (fitMode === 'cover') {
    // Fill target dimensions, crop center
    const ratio = Math.max(targetW / srcW, targetH / srcH);
    const cropW = Math.round(targetW / ratio);
    const cropH = Math.round(targetH / ratio);
    const cropX = Math.round((srcW - cropW) / 2);
    const cropY = Math.round((srcH - cropH) / 2);

    const scaled = drawHighQualityDownscale(
      transformedCanvas,
      targetW,
      targetH,
      cropX,
      cropY,
      cropW,
      cropH
    );
    ctx.drawImage(scaled, 0, 0);
  }

  return resultCanvas;
}

/**
 * Converts a Canvas to a Blob with specified mime type and quality
 */
function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas 导出 Blob 失败'));
        }
      },
      format,
      format === 'image/png' ? undefined : quality
    );
  });
}

/**
 * Core processor for single image resize
 */
export async function processImage(
  source: File | string,
  settings: ResizeSettings
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  size: number;
}> {
  const img = await loadImage(source);

  // 1. Transformations: Rotation, Flip, Crop
  const transformed = applyTransformations(
    img,
    settings.rotation,
    settings.flipHorizontal,
    settings.flipVertical,
    settings.crop
  );

  // 2. Determine target dimensions
  let { width: targetW, height: targetH } = calculateTargetDimensions(
    transformed.width,
    transformed.height,
    settings
  );

  // 3. Render with fit mode
  let finalCanvas = renderWithFitMode(
    transformed,
    targetW,
    targetH,
    settings.fitMode,
    settings.fillColor,
    settings.format
  );

  // 4. Handle Target Size (KB) mode with binary search optimization
  if (settings.mode === 'target_size' && settings.targetSizeKB > 0) {
    const targetBytes = settings.targetSizeKB * 1024;
    return await optimizeToTargetSize(
      transformed,
      targetW,
      targetH,
      targetBytes,
      settings
    );
  }

  // 5. Standard encoding
  const blob = await canvasToBlob(finalCanvas, settings.format, settings.quality);

  return {
    blob,
    width: finalCanvas.width,
    height: finalCanvas.height,
    size: blob.size,
  };
}

/**
 * Binary search optimizer to fit under target size (KB) with best quality & dimensions
 */
async function optimizeToTargetSize(
  sourceCanvas: HTMLCanvasElement,
  initialW: number,
  initialH: number,
  targetBytes: number,
  settings: ResizeSettings
): Promise<{ blob: Blob; width: number; height: number; size: number }> {
  // If target format is PNG (lossless), we can only scale down dimensions
  // For JPEG or WebP, we can scale down quality AND dimensions
  let currentW = initialW;
  let currentH = initialH;
  let format = settings.format;
  if (format === 'image/png') {
    format = 'image/jpeg'; // JPEG allows compression slider
  }

  let bestBlob: Blob | null = null;
  let bestW = currentW;
  let bestH = currentH;

  // Step 1: Binary search on quality (0.1 to 0.95)
  for (let scaleAttempt = 0; scaleAttempt < 4; scaleAttempt++) {
    const canvas = renderWithFitMode(
      sourceCanvas,
      currentW,
      currentH,
      settings.fitMode,
      settings.fillColor,
      format
    );

    let lowQ = 0.15;
    let highQ = 0.92;
    let foundUnderTarget = false;

    for (let iter = 0; iter < 5; iter++) {
      const testQ = (lowQ + highQ) / 2;
      const b = await canvasToBlob(canvas, format, testQ);

      if (b.size <= targetBytes) {
        foundUnderTarget = true;
        bestBlob = b;
        bestW = currentW;
        bestH = currentH;
        lowQ = testQ; // Try higher quality
      } else {
        highQ = testQ; // Lower quality
      }
    }

    if (foundUnderTarget && bestBlob) {
      return {
        blob: bestBlob,
        width: bestW,
        height: bestH,
        size: bestBlob.size,
      };
    }

    // Still too large at lowest quality! Downscale dimensions by 20%
    currentW = Math.max(50, Math.round(currentW * 0.8));
    currentH = Math.max(50, Math.round(currentH * 0.8));
  }

  // Fallback: If still couldn't reach, return smallest achieved
  const fallbackCanvas = renderWithFitMode(
    sourceCanvas,
    currentW,
    currentH,
    settings.fitMode,
    settings.fillColor,
    format
  );
  const fallbackBlob = await canvasToBlob(fallbackCanvas, format, 0.2);
  return {
    blob: fallbackBlob,
    width: fallbackCanvas.width,
    height: fallbackCanvas.height,
    size: fallbackBlob.size,
  };
}
