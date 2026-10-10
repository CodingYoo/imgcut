export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDimensions(w: number, h: number): string {
  return `${Math.round(w)} × ${Math.round(h)} px`;
}

export function calculateSavings(originalSize: number, newSize: number) {
  if (!originalSize || !newSize) return { percent: 0, saved: false, diffText: '0%' };
  const diff = originalSize - newSize;
  const percent = Math.round((Math.abs(diff) / originalSize) * 100);
  const saved = diff > 0;
  return {
    percent,
    saved,
    diffText: saved ? `体积缩减 ${percent}%` : `体积增加 ${percent}%`,
  };
}

export function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}
