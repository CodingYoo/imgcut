/**
 * Generates sample images dynamically using Canvas to allow immediate testing
 */
export function createSampleImage(type: 'landscape' | 'portrait' | 'ultra'): File {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (type === 'landscape') {
    canvas.width = 1920;
    canvas.height = 1080;
    
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.6, '#38bdf8');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.beginPath();
    ctx.arc(1400, 260, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    // Mountains
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(100, 1080);
    ctx.lineTo(600, 420);
    ctx.lineTo(1100, 1080);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(700, 1080);
    ctx.lineTo(1250, 480);
    ctx.lineTo(1800, 1080);
    ctx.fill();

    // Text watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('示例高清风景照 (1920 × 1080)', 80, 120);
    ctx.font = '28px sans-serif';
    ctx.fillText('可用于测试等比例缩小、格式转换或压缩测试', 80, 170);

    return canvasToFile(canvas, 'sample_landscape_1080p.jpg', 'image/jpeg');
  } else if (type === 'portrait') {
    canvas.width = 1200;
    canvas.height = 1600;

    // Studio portrait backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simulated portrait avatar
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(600, 650, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.ellipse(600, 1300, 450, 500, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('人像证件照测试源图', 600, 180);
    ctx.font = '28px sans-serif';
    ctx.fillText('适合测试制作 1寸/2寸 证件照与指定 KB 压缩', 600, 240);

    return canvasToFile(canvas, 'sample_portrait_photo.jpg', 'image/jpeg');
  } else {
    // 4K Ultra photo
    canvas.width = 3840;
    canvas.height = 2160;

    const grad = ctx.createRadialGradient(1920, 1080, 200, 1920, 1080, 2200);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    for (let x = 0; x < canvas.width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 160) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('4K 超高清测试图 (3840 × 2160)', 1920, 1000);
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('测试浏览器多阶下采样与画质抗锯齿算法', 1920, 1140);

    return canvasToFile(canvas, 'sample_4k_wallpaper.png', 'image/png');
  }
}

function canvasToFile(canvas: HTMLCanvasElement, filename: string, mime: string): File {
  const dataUrl = canvas.toDataURL(mime, 0.95);
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeMatch });
}
