import * as THREE from "three";

export const COLORS = {
  rabbit: 0xffb6d5,
  innerEar: 0xff7eb6,
  cream: 0xfff3f8,
  white: 0xfffdfb,
  lilac: 0xc9a7ff,
  mint: 0xa8f0d1,
  peach: 0xffd1a8,
  sky: 0xa8d8ff,
  gold: 0xffd66b,
  raspberry: 0xff5c9e,
  pink: 0xff9ec9,
  deepPink: 0xe75a9a,
  ink: 0x4a2338,
  scaryFrame: 0x1b1024,
  scaryWood: 0x2a1a3a,
  scaryGreen: 0x7cff6b,
  scaryRed: 0xff2b4d,
  night: 0x171032,
};

export const PASTELS = [0xffb6d5, 0xc9a7ff, 0xa8f0d1, 0xffd1a8, 0xa8d8ff, 0xffd66b, 0xfff3f8];

const _anisotropy = 8;

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0,
    ...opts,
  });
}

export function basicMat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

export function emissiveMat(color, intensity = 1, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.45,
    metalness: 0,
    ...opts,
  });
}

export function canvasTexture(w, h, draw, opts = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = _anisotropy;
  if (opts.repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  texture.needsUpdate = true;
  return texture;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function makeCanvasTextTexture(text, opts = {}) {
  const {
    width = 512,
    height = 256,
    font = "600 92px Fredoka, sans-serif",
    color = "#ffffff",
    bg = null,
    border = null,
    borderWidth = 10,
    radius = 30,
    align = "center",
    padding = 28,
    lineHeight = 1.15,
    stroke = null,
    strokeWidth = 0,
    shadow = true,
    rotate = 0,
    wood = false,
  } = opts;

  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      ctx.save();
      if (rotate) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotate);
        ctx.translate(-w / 2, -h / 2);
      }
      roundRect(ctx, 4, 4, w - 8, h - 8, radius);
      ctx.fillStyle = bg;
      ctx.fill();
      if (wood) {
        for (let i = 0; i < 26; i++) {
          ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.07})`;
          ctx.lineWidth = 1 + Math.random() * 2;
          ctx.beginPath();
          const yy = Math.random() * h;
          ctx.moveTo(8, yy);
          ctx.bezierCurveTo(w * 0.3, yy + (Math.random() - 0.5) * 22, w * 0.7, yy + (Math.random() - 0.5) * 22, w - 8, yy);
          ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.beginPath();
          ctx.ellipse(Math.random() * w, Math.random() * h, 14 + Math.random() * 28, 4 + Math.random() * 8, Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (border) {
        roundRect(ctx, 8, 8, w - 16, h - 16, Math.max(radius - 4, 4));
        ctx.strokeStyle = border;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (rotate) ctx.rotate(rotate);
    ctx.translate(-w / 2, -h / 2);
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    if (shadow) {
      ctx.shadowColor = "rgba(40,10,30,0.28)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
    }
    const lines = String(text).split("\n");
    const fs = parseInt(font.match(/(\d+)px/)?.[1] || "72", 10);
    const totalH = (lines.length - 1) * fs * lineHeight;
    const x = align === "left" ? padding : align === "right" ? w - padding : w / 2;
    lines.forEach((line, i) => {
      const y = h / 2 - totalH / 2 + i * fs * lineHeight;
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = "round";
        ctx.strokeText(line, x, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
    });
    ctx.restore();
  });
}

export function makeSignTexture({ title, sub, sub2, titleFont, subFont, titleColor, subColor, bg, border, wood = true, width = 640, height = 360 }) {
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.fillStyle = bg;
    ctx.fill();
    if (wood) {
      for (let i = 0; i < 42; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.09})`;
        ctx.lineWidth = 1 + Math.random() * 2.2;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 26, w * 0.7, y + (Math.random() - 0.5) * 26, w - 10, y);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 30, 5 + Math.random() * 7, Math.random(), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    roundRect(ctx, 12, 12, w - 24, h - 24, 20);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(34, 34, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w - 34, 34, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.font = titleFont;
    ctx.fillStyle = titleColor;
    ctx.fillText(title, w / 2, h * (sub ? 0.34 : 0.47));
    if (sub) {
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.font = subFont;
      ctx.fillStyle = subColor;
      wrapCanvasText(ctx, sub, w / 2, h * 0.62, w - 80, 40);
    }
    if (sub2) {
      ctx.font = subFont.replace(/\d+px/, (n) => `${Math.round(parseInt(n) * 0.82)}px`);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      wrapCanvasText(ctx, sub2, w / 2, h * 0.8, w - 90, 30);
    }
  });
}

export function wrapCanvasText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}

export function makeFloorTexture() {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = "#8a6248";
      ctx.fillRect(0, 0, w, h);
      const rows = 8;
      const rowH = h / rows;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (w / 8);
        for (let c = -1; c < 4; c++) {
          const x = c * (w / 4) + offset;
          const shade = 0.82 + Math.random() * 0.28;
          const base = [126 * shade, 88 * shade, 62 * shade];
          ctx.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`;
          ctx.fillRect(x, r * rowH, w / 4 - 3, rowH - 3);
          ctx.strokeStyle = "rgba(52,28,18,0.5)";
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1, r * rowH + 1, w / 4 - 4, rowH - 4);
          for (let g = 0; g < 8; g++) {
            ctx.strokeStyle = `rgba(70,38,24,${0.08 + Math.random() * 0.12})`;
            ctx.lineWidth = 1.2;
            const gy = r * rowH + 8 + Math.random() * (rowH - 16);
            ctx.beginPath();
            ctx.moveTo(x + 8, gy);
            ctx.bezierCurveTo(x + w / 12, gy + (Math.random() - 0.5) * 8, x + w / 6, gy + (Math.random() - 0.5) * 8, x + w / 4 - 8, gy);
            ctx.stroke();
          }
          if (Math.random() < 0.22) {
            ctx.fillStyle = "rgba(54,28,16,0.5)";
            ctx.beginPath();
            ctx.ellipse(x + w / 8 + Math.random() * (w / 8), r * rowH + rowH / 2, 7, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "rgba(255,220,180,0.12)");
      grad.addColorStop(0.5, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(60,20,30,0.2)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: [3, 5] }
  );
}

export function makeWoodTexture(base = "#3a2144", dark = "#1d1028") {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const plankW = w / 5;
    for (let i = 0; i < 5; i++) {
      const shade = 0.85 + Math.random() * 0.25;
      ctx.fillStyle = shadeColor(base, shade);
      ctx.fillRect(i * plankW + 2, 0, plankW - 4, h);
      ctx.strokeStyle = dark;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(i * plankW, 0);
      ctx.lineTo(i * plankW, h);
      ctx.stroke();
      for (let g = 0; g < 26; g++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.12})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        const x = i * plankW + 8 + Math.random() * (plankW - 16);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (Math.random() - 0.5) * 14, h * 0.3, x + (Math.random() - 0.5) * 14, h * 0.7, x, h);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 16 + Math.random() * 28, 5 + Math.random() * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function shadeColor(hex, factor) {
  const c = new THREE.Color(hex);
  return `rgb(${Math.min(255, c.r * 255 * factor) | 0},${Math.min(255, c.g * 255 * factor) | 0},${Math.min(255, c.b * 255 * factor) | 0})`;
}

export function makePrettyWallpaper() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#ffe8f1");
      g.addColorStop(1, "#ffdce9");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const px = x * 128 + (y % 2 ? 64 : 0) + 32;
          const py = y * 128 + 32;
          drawFlower(ctx, px, py, 16 + Math.random() * 4, "rgba(255,255,255,0.75)", "rgba(255,214,107,0.75)");
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.arc(px + 62, py + 54, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [2, 1.4] }
  );
}

export function drawFlower(ctx, x, y, r, petal, center) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72, r * 0.6, r * 0.42, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
}

export function makeScaryWallpaper() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1d0e29");
      g.addColorStop(0.5, "#2a1639");
      g.addColorStop(1, "#24122f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          ctx.strokeStyle = "rgba(115,72,145,0.18)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const cx = x * 170 + 85;
          const cy = y * 170 + 85;
          ctx.moveTo(cx, cy - 55);
          ctx.bezierCurveTo(cx + 45, cy - 15, cx + 45, cy + 15, cx, cy + 55);
          ctx.bezierCurveTo(cx - 45, cy + 15, cx - 45, cy - 15, cx, cy - 55);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 22; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.35})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (Math.random() - 0.5) * 40;
          y += 10 + Math.random() * 22;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 50, 8 + Math.random() * 22, Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [2, 1.4] }
  );
}

export function makeHallwayWallTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#1c0e29");
    g.addColorStop(0.32, "#2a173b");
    g.addColorStop(0.5, "#6b3b5c");
    g.addColorStop(0.7, "#ffd5e5");
    g.addColorStop(1, "#ffe6ef");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, "rgba(0,0,0,0.28)");
    v.addColorStop(0.45, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.26)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 28; i++) {
      const x = Math.random() * w;
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 30, h * 0.3, x - 30, h * 0.6, x + 10, h);
      ctx.stroke();
    }

    for (let i = 0; i < 26; i++) {
      const x = w * 0.5 + Math.random() * w * 0.45;
      const y = Math.random() * h;
      const rr = Math.random() * 2.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 7; i++) {
      drawFlower(ctx, w * 0.58 + Math.random() * w * 0.38, Math.random() * h, 8 + Math.random() * 8, "rgba(255,255,255,0.35)", "rgba(255,214,107,0.5)");
    }
  });
}

export function makeStarryTexture() {
  return canvasTexture(1024, 768, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#140c31");
    g.addColorStop(0.55, "#2c1b58");
    g.addColorStop(1, "#6b3a78");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.9;
      const r = Math.random() * 2.2 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (r > 1.9) {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
      }
    }
    const mx = w * 0.74;
    const my = h * 0.25;
    const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 150);
    halo.addColorStop(0, "rgba(255,244,200,0.35)");
    halo.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 160, my - 160, 320, 320);
    ctx.fillStyle = "#fff2c4";
    ctx.beginPath();
    ctx.arc(mx, my, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a1a52";
    ctx.beginPath();
    ctx.arc(mx - 28, my - 14, 60, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, h * 0.55 + Math.random() * h * 0.4, 60 + Math.random() * 90, 20 + Math.random() * 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makePolkaTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#ffe9f2");
      g.addColorStop(1, "#ffd9e8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const px = x * 64 + (y % 2 ? 32 : 0) + 16;
          const py = y * 64 + 16;
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [3, 1.6] }
  );
}

export function makePrettyCarpetTexture() {
  return canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 8, 8, w - 16, h - 16, 26);
    ctx.fillStyle = "#fff3f8";
    ctx.fill();
    ctx.save();
    roundRect(ctx, 20, 20, w - 40, h - 40, 20);
    ctx.clip();
    for (let y = 20; y < h - 20; y += 48) {
      ctx.fillStyle = (y / 48) % 2 === 0 ? "#ff5c9e" : "#fff3f8";
      ctx.fillRect(20, y, w - 40, 48);
    }
    for (let y = 44; y < h - 20; y += 96) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let x = 42; x < w - 20; x += 42) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = "#ffd66b";
    ctx.lineWidth = 5;
    roundRect(ctx, 17, 17, w - 34, h - 34, 22);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, h - 24);
    for (let x = 10; x < w - 10; x += 16) {
      ctx.lineTo(x, h - 4 + Math.sin(x) * 5);
      ctx.lineTo(x + 8, h - 18);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 24);
    for (let x = 10; x < w - 10; x += 16) {
      ctx.lineTo(x, 4 + Math.sin(x) * 5);
      ctx.lineTo(x + 8, 18);
    }
    ctx.stroke();
  });
}

export function makeTatteredCarpetTexture() {
  return canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(30, 8);
    for (let y = 8; y <= h - 8; y += 22) {
      ctx.lineTo(16 + Math.random() * 26, y);
    }
    for (let x = 30; x <= w - 30; x += 22) {
      ctx.lineTo(x, h - 8 - Math.random() * 26);
    }
    for (let y = h - 8; y >= 8; y -= 22) {
      ctx.lineTo(w - 16 - Math.random() * 26, y);
    }
    for (let x = w - 30; x >= 30; x -= 22) {
      ctx.lineTo(x, 8 + Math.random() * 26);
    }
    ctx.closePath();
    ctx.save();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#251430");
    g.addColorStop(0.5, "#3c2148");
    g.addColorStop(1, "#1d0f26");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 54) {
      ctx.fillStyle = "rgba(107,60,95,0.3)";
      ctx.fillRect(0, y, w, 16);
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(10,4,16,${0.3 + Math.random() * 0.5})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      const x = Math.random() * w;
      ctx.beginPath();
      ctx.moveTo(x, Math.random() * h);
      ctx.lineTo(x + (Math.random() - 0.5) * 50, Math.random() * h);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 18, 3 + Math.random() * 12, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(w - 30, h - 30);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

export function makeGlowTexture(color = "255,255,255") {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, `rgba(${color},1)`);
    g.addColorStop(0.25, `rgba(${color},0.7)`);
    g.addColorStop(0.6, `rgba(${color},0.18)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeHeartTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2 + 6);
    ctx.scale(1, 1);
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.bezierCurveTo(-8, 24, -52, 6, -52, -18);
    ctx.bezierCurveTo(-52, -42, -22, -50, 0, -26);
    ctx.bezierCurveTo(22, -50, 52, -42, 52, -18);
    ctx.bezierCurveTo(52, 6, 8, 24, 0, 36);
    ctx.fillStyle = "#ff7eb6";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-22, -24, 10, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function makeSmokeTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(220,210,225,0.7)");
    g.addColorStop(0.5, "rgba(200,190,210,0.32)");
    g.addColorStop(1, "rgba(200,190,210,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeStarTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = "#fff6c9";
    ctx.shadowColor = "#ffe08a";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 44 : 18;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
}

export function roundedBoxGeometry(w, h, d, r = 0.06) {
  const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(d - radius, 0.002),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: 8,
  });
  geo.center();
  return geo;
}

export function makeHeartShape(w = 1, h = 1) {
  const s = new THREE.Shape();
  s.moveTo(0, h * 0.38);
  s.bezierCurveTo(0, h * 0.38, -w * 0.28, h * 0.55, -w * 0.5, h * 0.28);
  s.bezierCurveTo(-w * 0.7, h * 0.02, -w * 0.4, -h * 0.22, 0, -h * 0.48);
  s.bezierCurveTo(w * 0.4, -h * 0.22, w * 0.7, h * 0.02, w * 0.5, h * 0.28);
  s.bezierCurveTo(w * 0.28, h * 0.55, 0, h * 0.38, 0, h * 0.38);
  return s;
}

export function makeStarShape(outer = 0.5, inner = 0.22, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function tubeFromPoints(points, radius = 0.01, tubular = 64, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, tubular, radius, radial, false);
}

export function addOutline(mesh, color = 0xe75a9a, scale = 1.045) {
  const outline = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
  );
  outline.scale.setScalar(scale);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.raycast = () => {};
  mesh.add(outline);
  return outline;
}

export function makeToonGradient(steps = 3, light = 0xfff0f6, dark = 0x8a5570) {
  const c1 = new THREE.Color(dark);
  const c2 = new THREE.Color(light);
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 1 : i / (steps - 1);
    const c = c1.clone().lerp(c2, t);
    data[i * 4] = c.r * 255;
    data[i * 4 + 1] = c.g * 255;
    data[i * 4 + 2] = c.b * 255;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function makeBlobShadow(radius = 0.5, opacity = 0.32) {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(24,8,20,0.7)");
    g.addColorStop(0.55, "rgba(24,8,20,0.32)");
    g.addColorStop(1, "rgba(24,8,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

export function makeLabelSprite(text, opts = {}) {
  const {
    width = 512,
    height = 220,
    bg = "rgba(255,248,251,0.97)",
    border = "#ff7eb6",
    color = "#7a3d5d",
    font = "600 62px Fredoka, sans-serif",
    scale = 1,
    padding = 26,
  } = opts;
  const tex = canvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowColor = "rgba(50,10,35,0.3)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 14, 10, w - 28, h - 54, 34);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 7;
    ctx.strokeStyle = border;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 22, h - 46);
    ctx.lineTo(w / 2, h - 12);
    ctx.lineTo(w / 2 + 22, h - 46);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = bg;
    ctx.fillRect(w / 2 - 24, h - 50, 48, 8);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    wrapCanvasText(ctx, text, w / 2, h / 2 - 18, w - padding * 2, 64);
  });
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false })
  );
  sprite.scale.set(1.35 * scale, (1.35 * height) / width * scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

/* ------------------------------------------------------------------ */
/* Particles                                                          */
/* ------------------------------------------------------------------ */

function makeSpritePool({ count, texture, color, opacity = 1, blending = THREE.NormalBlending }) {
  const sprites = [];
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending,
      toneMapped: false,
    });
    const s = new THREE.Sprite(material);
    s.visible = false;
    s.userData = { active: false, life: 0, maxLife: 1, vel: new THREE.Vector3(), spin: 0, baseScale: 0.2, wobble: Math.random() * 10 };
    group.add(s);
    sprites.push(s);
  }
  return { group, sprites };
}

export function makeSprayParticles(type = "confetti", opts = {}) {
  const group = new THREE.Group();
  group.frustumCulled = false;
  let update = () => {};
  let disposeExtra = () => {};
  let burst = () => {};

  if (type === "confetti") {
    const count = opts.count || 160;
    const geo = new THREE.PlaneGeometry(0.06, 0.04);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12),
        life: 0,
        maxLife: 1,
        size: 1,
      });
      dummy.position.set(0, -999, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(0xffffff));
    }
    group.add(mesh);
    let cursor = 0;
    burst = (origin, options = {}) => {
      const n = options.count || 60;
      const colors = options.colors || PASTELS;
      const speed = options.speed ?? 3.2;
      const spread = options.spread ?? 0.5;
      const up = options.upward ?? 2.8;
      const life = options.life ?? 2.4;
      for (let k = 0; k < n; k++) {
        const index = cursor % count;
        const p = parts[index];
        cursor++;
        p.active = true;
        p.pos.set(origin.x + (Math.random() - 0.5) * spread, origin.y + (Math.random() - 0.5) * spread * 0.5, origin.z + (Math.random() - 0.5) * spread);
        p.vel.set((Math.random() - 0.5) * speed, up * (0.45 + Math.random() * 0.75), (Math.random() - 0.5) * speed);
        p.life = 0;
        p.maxLife = life * (0.7 + Math.random() * 0.6);
        p.size = 0.7 + Math.random() * 0.9;
        p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        mesh.setColorAt(index, new THREE.Color(colors[(Math.random() * colors.length) | 0]));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const dummy2 = new THREE.Object3D();
    update = (dt) => {
      let any = false;
      for (let i = 0; i < count; i++) {
        const p = parts[i];
        if (!p.active) continue;
        any = true;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          dummy2.position.set(0, -999, 0);
          dummy2.updateMatrix();
          mesh.setMatrixAt(i, dummy2.matrix);
          continue;
        }
        p.vel.y -= 5.6 * dt;
        p.vel.multiplyScalar(1 - 0.9 * dt);
        p.pos.addScaledVector(p.vel, dt);
        if (p.pos.y < 0.015) {
          p.pos.y = 0.015;
          p.vel.set(p.vel.x * 0.7, 0, p.vel.z * 0.7);
        }
        p.rot.x += p.spin.x * dt;
        p.rot.y += p.spin.y * dt;
        p.rot.z += p.spin.z * dt;
        const fade = 1 - Math.max(0, (p.life / p.maxLife - 0.7) / 0.3);
        dummy2.position.copy(p.pos);
        dummy2.rotation.copy(p.rot);
        dummy2.scale.setScalar(Math.max(0.001, p.size * fade));
        dummy2.updateMatrix();
        mesh.setMatrixAt(i, dummy2.matrix);
      }
      if (any) mesh.instanceMatrix.needsUpdate = true;
    };
    disposeExtra = () => {
      geo.dispose();
      material.dispose();
    };
  } else if (type === "hearts") {
    const tex = makeHeartTexture();
    const { group: g, sprites } = makeSpritePool({ count: opts.count || 34, texture: tex, color: 0xffffff });
    group.add(g);
    let cursor = 0;
    burst = (origin, options = {}) => {
      const n = options.count || 8;
      const colors = options.colors || [0xff7eb6, 0xff9ec9, 0xff5c9e, 0xffd66b, 0xfff3f8];
      for (let k = 0; k < n; k++) {
        const s = sprites[cursor % sprites.length];
        cursor++;
        s.visible = true;
        s.material.color.setHex(colors[(Math.random() * colors.length) | 0]);
        s.position.set(origin.x + (Math.random() - 0.5) * 0.7, origin.y + Math.random() * 0.35, origin.z + (Math.random() - 0.5) * 0.7);
        const u = s.userData;
        u.active = true;
        u.life = 0;
        u.maxLife = 2 + Math.random() * 1.6;
        u.vel.set((Math.random() - 0.5) * 0.55, 0.7 + Math.random() * 0.65, (Math.random() - 0.5) * 0.3);
        u.baseScale = 0.16 + Math.random() * 0.16;
        u.spin = (Math.random() - 0.5) * 2;
        s.scale.setScalar(u.baseScale);
      }
    };
    update = (dt) => {
      for (const s of sprites) {
        const u = s.userData;
        if (!u.active) continue;
        u.life += dt;
        if (u.life >= u.maxLife) {
          u.active = false;
          s.visible = false;
          continue;
        }
        u.vel.y -= 0.15 * dt;
        s.position.addScaledVector(u.vel, dt);
        s.position.x += Math.sin(u.life * 3 + u.wobble) * 0.28 * dt;
        const fade = Math.min(1, u.life * 4) * (1 - Math.max(0, (u.life / u.maxLife - 0.72) / 0.28));
        s.material.opacity = fade;
        s.material.rotation += u.spin * dt;
        const pulse = 1 + Math.sin(u.life * 5 + u.wobble) * 0.08;
        s.scale.setScalar(u.baseScale * pulse * (0.6 + fade * 0.4));
      }
    };
    disposeExtra = () => {
      tex.dispose();
      for (const s of sprites) s.material.dispose();
    };
  } else if (type === "sparkles") {
    const count = opts.count || 260;
    const tex = makeGlowTexture("255,255,255");
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({ active: false, life: 0, maxLife: 1, vel: new THREE.Vector3(), pos: new THREE.Vector3(), color: new THREE.Color() });
      positions[i * 3 + 1] = -999;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.13,
      map: tex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, material);
    points.frustumCulled = false;
    group.add(points);
    let cursor = 0;
    burst = (origin, options = {}) => {
      const n = options.count || 24;
      const palette = options.colors || [0xffd66b, 0xffffff, 0xffb6d5, 0xa8d8ff, 0xc9a7ff];
      const speed = options.speed ?? 1.6;
      const life = options.life ?? 1.4;
      for (let k = 0; k < n; k++) {
        const p = parts[cursor % count];
        cursor++;
        p.active = true;
        p.life = 0;
        p.maxLife = life * (0.6 + Math.random() * 0.8);
        p.pos.set(origin.x + (Math.random() - 0.5) * (options.spread ?? 0.4), origin.y + (Math.random() - 0.5) * (options.spread ?? 0.4), origin.z + (Math.random() - 0.5) * (options.spread ?? 0.4));
        p.vel.set((Math.random() - 0.5) * speed, (Math.random() - 0.3) * speed, (Math.random() - 0.5) * speed);
        p.color.setHex(palette[(Math.random() * palette.length) | 0]);
      }
    };
    update = (dt) => {
      for (let i = 0; i < count; i++) {
        const p = parts[i];
        if (!p.active) {
          positions[i * 3 + 1] = -999;
          continue;
        }
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          positions[i * 3 + 1] = -999;
          continue;
        }
        p.vel.multiplyScalar(1 - 1.7 * dt);
        p.vel.y += 0.25 * dt;
        p.pos.addScaledVector(p.vel, dt);
        positions[i * 3] = p.pos.x;
        positions[i * 3 + 1] = p.pos.y;
        positions[i * 3 + 2] = p.pos.z;
        const fade = 1 - p.life / p.maxLife;
        colors[i * 3] = p.color.r * fade;
        colors[i * 3 + 1] = p.color.g * fade;
        colors[i * 3 + 2] = p.color.b * fade;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    };
    disposeExtra = () => {
      geo.dispose();
      material.dispose();
      tex.dispose();
    };
  } else if (type === "smoke") {
    const tex = makeSmokeTexture();
    const { group: g, sprites } = makeSpritePool({ count: opts.count || 24, texture: tex, color: 0xbfb4c7 });
    group.add(g);
    let cursor = 0;
    burst = (origin, options = {}) => {
      const n = options.count || 4;
      for (let k = 0; k < n; k++) {
        const s = sprites[cursor % sprites.length];
        cursor++;
        s.visible = true;
        s.material.color.setHex(options.color ?? 0xd8d0dd);
        s.position.copy(origin);
        s.position.x += (Math.random() - 0.5) * 0.08;
        s.position.z += (Math.random() - 0.5) * 0.08;
        const u = s.userData;
        u.active = true;
        u.life = 0;
        u.maxLife = 1.5 + Math.random() * 1.3;
        u.vel.set((Math.random() - 0.5) * 0.12, 0.32 + Math.random() * 0.3, (Math.random() - 0.5) * 0.12);
        u.baseScale = 0.15 + Math.random() * 0.12;
        s.scale.setScalar(u.baseScale);
      }
    };
    update = (dt) => {
      for (const s of sprites) {
        const u = s.userData;
        if (!u.active) continue;
        u.life += dt;
        if (u.life >= u.maxLife) {
          u.active = false;
          s.visible = false;
          continue;
        }
        s.position.addScaledVector(u.vel, dt);
        s.position.x += Math.sin(u.life * 2 + u.wobble) * 0.08 * dt;
        const t = u.life / u.maxLife;
        s.material.opacity = Math.sin(Math.min(1, t) * Math.PI) * 0.55;
        s.scale.setScalar(u.baseScale * (1 + t * 2.4));
        s.material.rotation += dt * 0.5;
      }
    };
    disposeExtra = () => {
      tex.dispose();
      for (const s of sprites) s.material.dispose();
    };
  } else if (type === "dust") {
    const tex = makeSmokeTexture();
    const { group: g, sprites } = makeSpritePool({ count: opts.count || 18, texture: tex, color: 0xf5dcc4, opacity: 0.5 });
    group.add(g);
    let cursor = 0;
    burst = (origin, options = {}) => {
      const n = options.count || 2;
      for (let k = 0; k < n; k++) {
        const s = sprites[cursor % sprites.length];
        cursor++;
        s.visible = true;
        s.material.color.setHex(options.color ?? 0xf1d9c4);
        s.position.copy(origin);
        const u = s.userData;
        u.active = true;
        u.life = 0;
        u.maxLife = 0.5 + Math.random() * 0.4;
        u.vel.set((Math.random() - 0.5) * 0.4, 0.12 + Math.random() * 0.25, (Math.random() - 0.5) * 0.4);
        u.baseScale = 0.06 + Math.random() * 0.07;
        s.scale.setScalar(u.baseScale);
      }
    };
    update = (dt) => {
      for (const s of sprites) {
        const u = s.userData;
        if (!u.active) continue;
        u.life += dt;
        if (u.life >= u.maxLife) {
          u.active = false;
          s.visible = false;
          continue;
        }
        s.position.addScaledVector(u.vel, dt);
        const t = u.life / u.maxLife;
        s.material.opacity = (1 - t) * 0.45;
        s.scale.setScalar(u.baseScale * (1 + t * 2));
      }
    };
    disposeExtra = () => {
      tex.dispose();
      for (const s of sprites) s.material.dispose();
    };
  }

  return {
    object3D: group,
    burst,
    update,
    dispose() {
      update = () => {};
      disposeExtra();
      group.clear();
    },
  };
}

export function disposeGroup(group) {
  if (!group) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  group.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry);
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        materials.add(m);
        for (const key of Object.keys(m)) {
          const value = m[key];
          if (value && value.isTexture) textures.add(value);
        }
      }
    }
  });
  geometries.forEach((g) => g.dispose?.());
  textures.forEach((t) => t.dispose?.());
  materials.forEach((m) => m.dispose?.());
}

export function makeSoftLight(color, intensity, distance, position) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.copy(position);
  return light;
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);
