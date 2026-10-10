export type ResizeMode = 'dimensions' | 'percentage' | 'target_size' | 'preset';

export type FitMode = 'cover' | 'contain' | 'stretch' | 'inside';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  originalType: string;
  previewUrl: string;
  
  // Processed state
  processedBlob?: Blob;
  processedUrl?: string;
  processedWidth?: number;
  processedHeight?: number;
  processedSize?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export interface CropArea {
  x: number; // 0 to 1 percentage or pixel
  y: number;
  width: number;
  height: number;
}

export interface ResizeSettings {
  mode: ResizeMode;
  
  // Dimensions mode
  width: number;
  height: number;
  lockAspectRatio: boolean;
  fitMode: FitMode;
  fillColor: string; // for contain mode padding
  
  // Percentage mode
  percentage: number;
  
  // Target Size mode
  targetSizeKB: number;
  
  // Preset mode
  selectedPresetId?: string;
  
  // Cropping & Transforms
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop?: CropArea; // null if no crop
  
  // Output options
  format: OutputFormat;
  quality: number; // 0.1 to 1.0 (for JPEG and WebP)
  filenameSuffix: string;
}

export interface PresetItem {
  id: string;
  name: string;
  category: 'id_photo' | 'social' | 'display' | 'ecommerce';
  width: number;
  height: number;
  description?: string;
  badge?: string;
}
