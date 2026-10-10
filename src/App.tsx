import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveAs } from 'file-saver';
import type {
  ImageItem,
  ResizeSettings,
  ActiveTool,
  CreationRecord,
} from './types';
import { processImage, loadImage } from './utils/imageProcess';
import { getExtensionFromMime } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { EditorWorkspace } from './components/EditorWorkspace';
import { BatchProcessor } from './components/BatchProcessor';
import { MyCreationsModal } from './components/MyCreationsModal';

export const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Navigation / View states
  const [activeNavTab, setActiveNavTab] = useState<'process' | 'creations'>('process');
  const [viewMode, setViewMode] = useState<'landing' | 'editor' | 'batch'>('landing');
  
  // Creations history
  const [creations, setCreations] = useState<CreationRecord[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Default resize settings
  const [settings, setSettings] = useState<ResizeSettings>({
    mode: 'dimensions',
    width: 1200,
    height: 800,
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
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
    },
    watermark: {
      enabled: false,
      text: 'PicScale',
      fontSize: 32,
      color: '#ffffff',
      opacity: 0.7,
      position: 'bottom-right',
    },
    format: 'image/jpeg',
    quality: 0.92,
    filenameSuffix: '_resized',
  });

  const selectedImage = images.find((i) => i.id === selectedId) || images[0] || null;

  // Add files to state
  const handleAddFiles = useCallback(
    async (files: File[], _initialTool?: ActiveTool) => {
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
        setImages((prev) => [...prev, ...newItems]);
        const first = newItems[0];
        setSelectedId(first.id);
        setSettings((s) => ({
          ...s,
          width: first.originalWidth,
          height: first.originalHeight,
          rotation: 0,
          crop: undefined,
        }));

        if (newItems.length > 1) {
          setViewMode('batch');
        } else {
          setViewMode('editor');
        }
        setActiveNavTab('process');
      }
    },
    []
  );

  // Synchronize width & height when selected image changes
  useEffect(() => {
    if (selectedImage) {
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

  // Debounced auto-processing whenever settings or image changes
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
    }, 150);

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
    settings.filters,
    settings.watermark,
    settings.format,
    settings.quality,
  ]);

  // Download single image & record to creations
  const handleDownloadSingle = () => {
    if (!selectedImage?.processedBlob) return;
    const ext = getExtensionFromMime(settings.format);
    const baseName = selectedImage.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_resized.${ext}`;

    saveAs(selectedImage.processedBlob, filename);

    // Save to creations
    const record: CreationRecord = {
      id: `${Date.now()}`,
      name: filename,
      timestamp: Date.now(),
      blob: selectedImage.processedBlob,
      url: URL.createObjectURL(selectedImage.processedBlob),
      width: selectedImage.processedWidth || settings.width,
      height: selectedImage.processedHeight || settings.height,
      size: selectedImage.processedSize || selectedImage.processedBlob.size,
      format: ext,
    };
    setCreations((prev) => [record, ...prev]);
  };

  // Remove creation
  const handleRemoveCreation = (id: string) => {
    setCreations((prev) => prev.filter((c) => c.id !== id));
  };

  // Clear creations
  const handleClearCreations = () => {
    setCreations([]);
  };

  // Update image in batch
  const handleUpdateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Remove image from list
  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      const remaining = images.filter((i) => i.id !== id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
        setViewMode('landing');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. If in Editor Mode, show Fullscreen SAAS Editor Workspace */}
      {viewMode === 'editor' && selectedImage && activeNavTab === 'process' ? (
        <EditorWorkspace
          image={selectedImage}
          settings={settings}
          onUpdateSettings={setSettings}
          onBack={() => setViewMode('landing')}
          onDownload={handleDownloadSingle}
          onBatchView={() => setViewMode('batch')}
          isProcessing={isProcessing}
        />
      ) : (
        /* 2. Standard View with Top Navbar */
        <>
          <Navbar
            activeTab={activeNavTab}
            onTabChange={(tab) => {
              setActiveNavTab(tab);
            }}
            creationsCount={creations.length}
            onGoHome={() => {
              setActiveNavTab('process');
              setViewMode('landing');
            }}
          />

          <main className="flex-1 flex flex-col">
            {activeNavTab === 'creations' ? (
              /* My Creations View */
              <MyCreationsModal
                creations={creations}
                onRemoveCreation={handleRemoveCreation}
                onClearAll={handleClearCreations}
                onBackToProcess={() => {
                  setActiveNavTab('process');
                  setViewMode(images.length > 0 ? 'editor' : 'landing');
                }}
              />
            ) : viewMode === 'batch' && images.length > 0 ? (
              /* Batch Processing Queue View */
              <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewMode('editor')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      ← 返回单图编辑
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 m-0">批量处理管理</h2>
                  </div>
                </div>

                <BatchProcessor
                  images={images}
                  settings={settings}
                  onUpdateImage={handleUpdateImage}
                  onRemoveImage={handleRemoveImage}
                  onAddFiles={handleAddFiles}
                  onSelectForSingleEdit={(item) => {
                    setSelectedId(item.id);
                    setViewMode('editor');
                  }}
                />
              </div>
            ) : (
              /* Landing Hero (Recreating Screen 1) */
              <LandingHero onFilesSelected={handleAddFiles} />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
