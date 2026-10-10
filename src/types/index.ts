export type ActiveTool =
  | 'crop'
  | 'rotate'
  | 'convert'
  | 'compress'
  | 'filter'
  | 'watermark'
  | 'more';

export type ResizeMode = 'dimensions' | 'percentage' | 'target_size' | 'preset';

export type FitMode = 'cover' | 'contain' | 'stretch' | 'inside';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FilterSettings {
  brightness: number; // 0 - 200, default 100
  contrast: number; // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  grayscale: number; // 0 - 100, default 0
  sepia: number; // 0 - 100, default 0
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  fontSize: number;
  color: string;
  opacity: number; // 0.1 - 1
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right';
}

export interface ResizeSettings {
  mode: ResizeMode;
  
  // Dimensions
  width: number;
  height: number;
  lockAspectRatio: boolean;
  fitMode: FitMode;
  fillColor: string;
  
  // Percentage
  percentage: number;
  
  // Target Size (KB)
  targetSizeKB: number;
  
  // Preset
  selectedPresetId?: string;
  
  // Transforms
  rotation: number; // 0 - 360
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop?: CropArea;
  
  // Filters & Watermark
  filters: FilterSettings;
  watermark: WatermarkSettings;
  
  // Output
  format: OutputFormat;
  quality: number; // 0.1 - 1.0
  filenameSuffix: string;
}

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

export interface HistoryRecord {
  id: string;
  timestamp: number;
  description: string;
  settings: ResizeSettings;
}

export interface CreationRecord {
  id: string;
  name: string;
  timestamp: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
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
