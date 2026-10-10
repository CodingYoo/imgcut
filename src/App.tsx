import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveAs } from 'file-saver';
import type { ImageItem, ResizeSettings } from './types';
import { processImage, loadImage } from './utils/imageProcess';
import { getExtensionFromMime } from './utils/formatters';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ImagePreview } from './components/ImagePreview';
import { ResizeControls } from './components/ResizeControls';
import { CropModal } from './components/CropModal';
import { BatchProcessor } from './components/BatchProcessor';

export const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Default resize settings
  const [settings, setSettings] = useState<ResizeSettings>({
    mode: 'dimensions',
    width: 1920,
    height: 1080,
    lockAspectRatio: true,
    fitMode: 'inside',
    fillColor: '#ffffff',
    percentage: 100,
    targetSizeKB: 200,
    selectedPresetId: undefined,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    crop: undefined,
    format: 'image/webp',
    quality: 0.85,
    filenameSuffix: '_resized',
  });

  const selectedImage = images.find((i) => i.id === selectedId) || images[0] || null;

  // Revoke object URLs on cleanup
  const revokeImageUrls = (item: ImageItem) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
  };

  // Add files to state
  const handleAddFiles = useCallback(async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (const file of files) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const img = await loadImage(previewUrl);

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          originalSize: file.size,
          originalType: file.type || 'image/jpeg',
          previewUrl,
          status: 'idle',
        });
      } catch (err) {
        console.error('Error reading image file:', err);
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...newItems];
        return updated;
      });

      // If no image was selected, pick the first new one and init width/height
      if (!selectedId) {
        const first = newItems[0];
        setSelectedId(first.id);
        setSettings((s) => ({
          ...s,
          width: first.originalWidth,
          height: first.originalHeight,
        }));
      }

      // If user uploaded more than 1 image and was on blank screen, switch to batch tab
      if (newItems.length > 1 && images.length === 0) {
        setActiveTab('batch');
      }
    }
  }, [images.length, selectedId]);

  // When selected image changes, sync initial width & height
  useEffect(() => {
    if (selectedImage && settings.mode === 'dimensions') {
      setSettings((prev) => ({
        ...prev,
        width: selectedImage.originalWidth,
        height: selectedImage.originalHeight,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        crop: undefined,
      }));
    }
  }, [selectedImage?.id]);

  // Process single image automatically when settings or selected image changes (debounced)
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!selectedImage) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const result = await processImage(selectedImage.file, settings);
        const url = URL.createObjectURL(result.blob);

        setImages((prev) =>
          prev.map((img) => {
            if (img.id === selectedImage.id) {
              if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
              return {
                ...img,
                processedBlob: result.blob,
                processedUrl: url,
                processedWidth: result.width,
                processedHeight: result.height,
                processedSize: result.size,
                status: 'done',
              };
            }
            return img;
          })
        );
      } catch (err: any) {
        console.error('Process error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    selectedImage?.id,
    settings.mode,
    settings.width,
    settings.height,
    settings.lockAspectRatio,
    settings.fitMode,
    settings.fillColor,
    settings.percentage,
    settings.targetSizeKB,
    settings.selectedPresetId,
    settings.rotation,
    settings.flipHorizontal,
    settings.flipVertical,
    settings.crop,
    settings.format,
    settings.quality,
  ]);

  // Download single image
  const handleDownloadSingle = () => {
    if (!selectedImage?.processedBlob) return;
    const ext = getExtensionFromMime(settings.format);
    const baseName = selectedImage.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_resized.${ext}`;
    saveAs(selectedImage.processedBlob, filename);
  };

  // Remove single image
  const handleRemoveImage = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (item) revokeImageUrls(item);
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      const remaining = images.filter((i) => i.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    images.forEach(revokeImageUrls);
    setImages([]);
    setSelectedId(null);
  };

  // Update single image state
  const handleUpdateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        imageCount={images.length}
        onClear={handleClearAll}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {images.length === 0 ? (
          /* Empty / Upload State */
          <div className="flex-1 flex flex-col items-center justify-center">
            <DropZone onFilesSelected={handleAddFiles} />
          </div>
        ) : activeTab === 'batch' ? (
          /* Batch Mode View */
          <BatchProcessor
            images={images}
            settings={settings}
            onUpdateImage={handleUpdateImage}
            onRemoveImage={handleRemoveImage}
            onAddFiles={handleAddFiles}
            onSelectForSingleEdit={(item) => {
              setSelectedId(item.id);
              setActiveTab('single');
            }}
          />
        ) : (
          /* Single Fine-tuning View */
          <div className="flex-1 flex flex-col gap-6">
            {/* Image Selector Strip if multiple images loaded */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                  当前图片列表 ({images.length}):
                </span>
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedId(img.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                      img.id === selectedImage?.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-5 h-5 rounded object-cover"
                    />
                    <span className="truncate max-w-[120px]">{img.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Split Screen Layout: Left Preview / Right Controls */}
            {selectedImage && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Preview Column */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                  <ImagePreview
                    image={selectedImage}
                    onOpenCrop={() => setIsCropModalOpen(true)}
                    onDownload={handleDownloadSingle}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Right Parameter Controls Column */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                  <ResizeControls
                    settings={settings}
                    onChange={setSettings}
                    originalWidth={selectedImage.originalWidth}
                    originalHeight={selectedImage.originalHeight}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Crop & Rotate Modal */}
      {isCropModalOpen && selectedImage && (
        <CropModal
          imageUrl={selectedImage.previewUrl}
          originalWidth={selectedImage.originalWidth}
          originalHeight={selectedImage.originalHeight}
          initialCrop={settings.crop}
          initialRotation={settings.rotation}
          initialFlipH={settings.flipHorizontal}
          initialFlipV={settings.flipVertical}
          onApply={(params) => {
            setSettings((s) => ({
              ...s,
              crop: params.crop,
              rotation: params.rotation,
              flipHorizontal: params.flipHorizontal,
              flipVertical: params.flipVertical,
              // If cropped, update width and height
              width: params.crop ? params.crop.width : s.width,
              height: params.crop ? params.crop.height : s.height,
            }));
            setIsCropModalOpen(false);
          }}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
