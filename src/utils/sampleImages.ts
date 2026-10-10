/**
 * Generates sample images with rich canvas graphics matching the design mockup thumbnails
 */
export function createSampleImage(type: 'mountain' | 'sunset' | 'cat' | 'leaf' | 'city'): File {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  switch (type) {
    case 'mountain': {
      // 1. Lake & Mountain (湖光山色)
      canvas.width = 1600;
      canvas.height = 1060;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 600);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(0.5, '#7dd3fc');
      sky.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant Snowy Mountains
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(100, 700);
      ctx.lineTo(500, 240);
      ctx.lineTo(900, 700);
      ctx.fill();

      // Snow on peak
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(500, 240);
      ctx.lineTo(400, 380);
      ctx.lineTo(600, 380);
      ctx.fill();

      // Second peak
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(600, 700);
      ctx.lineTo(1100, 200);
      ctx.lineTo(1600, 700);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(1100, 200);
      ctx.lineTo(980, 350);
      ctx.lineTo(1220, 350);
      ctx.fill();

      // Blue Lake
      const lake = ctx.createLinearGradient(0, 700, 0, 1060);
      lake.addColorStop(0, '#0284c7');
      lake.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = lake;
      ctx.fillRect(0, 680, canvas.width, 380);

      // Castle island silhouette in center
      ctx.fillStyle = '#b45309';
      ctx.fillRect(750, 620, 100, 70);
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(740, 620);
      ctx.lineTo(800, 520);
      ctx.lineTo(860, 620);
      ctx.fill();

      return canvasToFile(canvas, 'sample_lake_mountain.jpg', 'image/jpeg');
    }

    case 'sunset': {
      // 2. Golden Sunset (金色落日)
      canvas.width = 1600;
      canvas.height = 1060;

      const sunset = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sunset.addColorStop(0, '#f97316');
      sunset.addColorStop(0.3, '#fb923c');
      sunset.addColorStop(0.6, '#fbbf24');
      sunset.addColorStop(1, '#b45309');
      ctx.fillStyle = sunset;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sun
      ctx.beginPath();
      ctx.arc(800, 480, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 60;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Horizon & Water reflection
      const water = ctx.createLinearGradient(0, 600, 0, canvas.height);
      water.addColorStop(0, '#ea580c');
      water.addColorStop(1, '#7c2d12');
      ctx.fillStyle = water;
      ctx.fillRect(0, 600, canvas.width, canvas.height - 600);

      // Sun reflection beam
      const beam = ctx.createLinearGradient(700, 600, 900, 600);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0)');
      beam.addColorStop(0.5, 'rgba(254, 240, 138, 0.7)');
      beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(650, 600, 300, 460);

      return canvasToFile(canvas, 'sample_golden_sunset.jpg', 'image/jpeg');
    }

    case 'cat': {
      // 3. Cute Cat (可爱小猫)
      canvas.width = 1200;
      canvas.height = 1200;

      // Warm background
      const bg = ctx.createRadialGradient(600, 600, 100, 600, 600, 800);
      bg.addColorStop(0, '#fef3c7');
      bg.addColorStop(1, '#d97706');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cat head
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(600, 640, 320, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(380, 440);
      ctx.lineTo(300, 180);
      ctx.lineTo(500, 360);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(820, 440);
      ctx.lineTo(900, 180);
      ctx.lineTo(700, 360);
      ctx.fill();

      // Inner pink ears
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(380, 410);
      ctx.lineTo(320, 240);
      ctx.lineTo(460, 360);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(820, 410);
      ctx.lineTo(880, 240);
      ctx.lineTo(740, 360);
      ctx.fill();

      // Big Eyes
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(480, 580, 50, 0, Math.PI * 2);
      ctx.arc(720, 580, 50, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(480, 580, 22, 45, 0, 0, Math.PI * 2);
      ctx.ellipse(720, 580, 22, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pink Nose
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(600, 670);
      ctx.lineTo(570, 630);
      ctx.lineTo(630, 630);
      ctx.fill();

      return canvasToFile(canvas, 'sample_cute_cat.jpg', 'image/jpeg');
    }

    case 'leaf': {
      // 4. Fresh Green Leaf (清新绿植)
      canvas.width = 1200;
      canvas.height = 1200;

      // Soft cream background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Main Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(600, 1100);
      ctx.quadraticCurveTo(580, 600, 600, 150);
      ctx.stroke();

      // Leaves
      const drawLeaf = (cx: number, cy: number, rot: number, size = 160) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.8, -size * 0.5, size, 0);
        ctx.quadraticCurveTo(size * 0.8, size * 0.5, 0, 0);
        ctx.fill();
        ctx.restore();
      };

      for (let y = 300; y < 1000; y += 120) {
        drawLeaf(590, y, -0.6, 180);
        drawLeaf(610, y + 60, 0.6, 180);
      }
      drawLeaf(600, 160, -1.57, 190);

      return canvasToFile(canvas, 'sample_fresh_leaf.png', 'image/png');
    }

    case 'city':
    default: {
      // 5. City Skyline (现代城市)
      canvas.width = 1600;
      canvas.height = 1060;

      // Dusk gradient
      const dusk = ctx.createLinearGradient(0, 0, 0, canvas.height);
      dusk.addColorStop(0, '#1e1b4b');
      dusk.addColorStop(0.5, '#4338ca');
      dusk.addColorStop(1, '#db2777');
      ctx.fillStyle = dusk;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Buildings
      const buildings = [
        { x: 100, w: 120, h: 450 },
        { x: 260, w: 160, h: 620 },
        { x: 460, w: 110, h: 520 },
        { x: 610, w: 200, h: 780 },
        { x: 850, w: 150, h: 860 }, // Center Skyscraper
        { x: 1040, w: 140, h: 650 },
        { x: 1220, w: 180, h: 540 },
        { x: 1440, w: 120, h: 420 },
      ];

      buildings.forEach((b) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(b.x, canvas.height - b.h, b.w, b.h);

        // Windows
        ctx.fillStyle = '#fde047';
        for (let wy = canvas.height - b.h + 20; wy < canvas.height - 40; wy += 35) {
          for (let wx = b.x + 15; wx < b.x + b.w - 15; wx += 25) {
            if (Math.random() > 0.3) {
              ctx.fillRect(wx, wy, 12, 16);
            }
          }
        }
      });

      return canvasToFile(canvas, 'sample_city_skyline.jpg', 'image/jpeg');
    }
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
