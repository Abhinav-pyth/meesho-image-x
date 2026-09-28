/* ------------------------------------------------------------------
 * Meesho Studio Pro — image engine
 * Faithful port of the rule-based canvas pipeline used by the
 * original ListIQ "Meesho Low Shipping Image Generator", extended
 * with premium controls (custom sizes, quality targets, brand
 * colours, watermark studio, background removal & edge detect).
 * ------------------------------------------------------------------ */

export const PRESETS = {
  meesho: { name: 'Meesho', imagesPerGeneration: 20, stickersAllowed: true, dimensions: { width: 1200, height: 1200 } },
  amazon: { name: 'Amazon', imagesPerGeneration: 5, stickersAllowed: false, dimensions: { width: 1600, height: 1600 } },
};

// Meesho shipping rate model (same figures as the source tool)
export const SHIPPING_RATES = {
  local: { base: 50, perAdditional: 18 },
  zonal: { base: 60, perAdditional: 20 },
  national: { base: 75, perAdditional: 25 },
};
export const SHIPPING_ZONES = [
  { id: 'local', label: 'Local', meaning: 'Buyer in the same city as your pickup address' },
  { id: 'zonal', label: 'Zonal', meaning: 'Buyer in the same region (North to North)' },
  { id: 'national', label: 'National', meaning: 'Buyer anywhere else in India' },
];
export const GST_RATE = 0.18;
export const forwardShipping = (weightG, zone) => {
  const { base, perAdditional } = SHIPPING_RATES[zone];
  if (weightG <= 500) return base;
  return base + Math.ceil((weightG - 500) / 500) * perAdditional;
};
export const rtoCost = (weightG, zone) => Math.round(forwardShipping(weightG, zone) * 0.5);

export const PALETTE = {
  charcoal: '#2B2B2B',
  deepNavy: '#1F3A5F',
  darkBrown: '#3A2F2F',
  forestGreen: '#243424',
  deepPurple: '#2E2A47',
  white: '#FFFFFF',
  lightGrey: '#F5F5F5',
  pastelBeige: '#FAF7F2',
};

export const STICKERS = {
  trusted: { text: 'Trusted', icon: '✔️', bgColor: '#E8F5E9', textColor: '#2E7D32' },
  bestseller: { text: 'Best Seller', bgColor: '#FFF3E0', textColor: '#E65100' },
  'green-check': { icon: '✓', bgColor: '#C8E6C9', textColor: '#1B5E20' },
  rating: { icon: '⭐', bgColor: '#FFFDE7', textColor: '#F9A825' },
  'quality-assured': { text: 'Quality', icon: '✓', bgColor: '#E3F2FD', textColor: '#1565C0' },
  popular: { text: '●', bgColor: '#FCE4EC', textColor: '#C2185B' },
  // Premium extras
  cod: { text: 'COD', icon: '💸', bgColor: '#EDE7F6', textColor: '#4527A0' },
  'free-shipping': { text: 'Free Ship', icon: '🚚', bgColor: '#E0F7FA', textColor: '#00695C' },
};

export const MEESHO_BASE_VARIANTS = [
  { id: 'meesho-1', name: 'Dark Charcoal Border', group: 'clean', borderWidth: 6, borderColor: PALETTE.charcoal, padding: 3, borderRadius: 0 },
  { id: 'meesho-2', name: 'Deep Navy Border', group: 'clean', borderWidth: 6, borderColor: PALETTE.deepNavy, padding: 3, borderRadius: 0 },
  { id: 'meesho-3', name: 'Dark Brown Border', group: 'clean', borderWidth: 6, borderColor: PALETTE.darkBrown, padding: 3, borderRadius: 0 },
  { id: 'meesho-4', name: 'Forest Green Border', group: 'clean', borderWidth: 6, borderColor: PALETTE.forestGreen, padding: 3, borderRadius: 0 },
  { id: 'meesho-5', name: 'Deep Purple Border', group: 'clean', borderWidth: 6, borderColor: PALETTE.deepPurple, padding: 3, borderRadius: 0 },
  { id: 'meesho-6', name: 'No Border + 8% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 8, borderRadius: 0 },
  { id: 'meesho-7', name: 'No Border + 12% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 12, borderRadius: 0 },
  { id: 'meesho-8', name: 'Medium Border (Light Grey)', group: 'clean', borderWidth: 4, borderColor: PALETTE.lightGrey, padding: 2, borderRadius: 0 },
  { id: 'meesho-9', name: 'Medium Border (Pastel Beige)', group: 'clean', borderWidth: 4, borderColor: PALETTE.pastelBeige, padding: 2, borderRadius: 0 },
  { id: 'meesho-10', name: 'Rounded Corners (6px)', group: 'clean', borderWidth: 0, borderColor: '', padding: 4, borderRadius: 6 },
  { id: 'meesho-11', name: 'Rounded Corners (10px)', group: 'clean', borderWidth: 0, borderColor: '', padding: 4, borderRadius: 10 },
  { id: 'meesho-12', name: 'Rounded + Thin White Border', group: 'clean', borderWidth: 2, borderColor: PALETTE.white, padding: 3, borderRadius: 10 },
  { id: 'meesho-13', name: 'Trusted Badge', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'trusted', position: 'top-right' } },
  { id: 'meesho-14', name: 'Best Seller Circle', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'bestseller', position: 'bottom-left' } },
  { id: 'meesho-15', name: 'Green Check Icon', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'green-check', position: 'top-right' } },
  { id: 'meesho-16', name: 'Rating Badge', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'rating', position: 'bottom-left' } },
  { id: 'meesho-17', name: 'Quality Assured Label', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'quality-assured', position: 'top-right' } },
  { id: 'meesho-18', name: 'Popular Tag', group: 'micro-sticker', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0, sticker: { type: 'popular', position: 'bottom-left' } },
  { id: 'meesho-19', name: 'Slight Left Shift', group: 'frame-shift', borderWidth: 0, borderColor: '', padding: 4, borderRadius: 0, cropShift: { direction: 'left', amount: 3 } },
  { id: 'meesho-20', name: 'Slight Right Shift', group: 'frame-shift', borderWidth: 0, borderColor: '', padding: 4, borderRadius: 0, cropShift: { direction: 'right', amount: 3 } },
];

export const AMAZON_BASE_VARIANTS = [
  { id: 'amazon-1', name: 'Clean + 3% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 3, borderRadius: 0 },
  { id: 'amazon-2', name: 'Clean + 5% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0 },
  { id: 'amazon-3', name: 'Clean + 8% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 8, borderRadius: 0 },
  { id: 'amazon-4', name: 'Clean + 10% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 10, borderRadius: 0 },
  { id: 'amazon-5', name: 'Clean + 12% Padding', group: 'clean', borderWidth: 0, borderColor: '', padding: 12, borderRadius: 0 },
];

export const GROUP_META = {
  clean: { label: 'Clean Optimization', color: 'emerald' },
  'micro-sticker': { label: 'Micro-Sticker', color: 'amber' },
  'frame-shift': { label: 'Frame Shift', color: 'blue' },
  custom: { label: 'Premium Custom', color: 'violet' },
};

export const SHIPPING_ESTIMATES = {
  clean: { range: '₹30–₹55', label: 'Est. Shipping: ₹30–₹55' },
  'micro-sticker': { range: '₹35–₹60', label: 'Est. Shipping: ₹35–₹60' },
  'frame-shift': { range: '₹25–₹50', label: 'Est. Shipping: ₹25–₹50' },
  custom: { range: '₹28–₹52', label: 'Est. Shipping: ₹28–₹52' },
};

/* ---------------- helpers ---------------- */

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), type, quality);
  });
}

// Iterative JPEG compression until under target KB (premium: configurable)
async function compressUnderKB(canvas, targetKB, startQ = 0.92) {
  const steps = [startQ, 0.85, 0.78, 0.72, 0.66, 0.6, 0.55, 0.5];
  let blob = null;
  let quality = startQ;
  for (const q of steps) {
    const b = await canvasToBlob(canvas, 'image/jpeg', q);
    blob = b;
    quality = q;
    if (b.size / 1024 <= targetKB) return { blob, quality };
  }
  return { blob, quality };
}

function drawSticker(ctx, type, position, size, productRect) {
  const cfg = STICKERS[type];
  if (!cfg) return;
  const d = Math.round(size * 0.07);
  const pad = Math.round(size * 0.02);
  let x, y;
  if (position === 'top-right') {
    x = size - d - pad;
    y = pad;
    if (x > productRect.x + productRect.width + pad) x = productRect.x + productRect.width + pad;
  } else {
    x = pad;
    y = size - d - pad;
    if (y < productRect.y + productRect.height + pad) y = productRect.y + productRect.height + pad;
  }
  x = Math.max(pad, Math.min(x, size - d - pad));
  y = Math.max(pad, Math.min(y, size - d - pad));

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = cfg.bgColor;
  const circle = type === 'bestseller' || type === 'popular';
  if (circle) {
    ctx.beginPath();
    ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const f = d * 0.15;
    ctx.beginPath();
    ctx.roundRect(x, y, d, d * 0.6, f);
    ctx.fill();
  }
  ctx.fillStyle = cfg.textColor;
  const fs = circle ? d * 0.25 : d * 0.35;
  ctx.font = `bold ${fs}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = x + d / 2;
  const cy = circle ? y + d / 2 : y + d * 0.3;
  if (cfg.icon && cfg.text) {
    ctx.fillText(cfg.icon, cx - fs, cy);
    ctx.fillText(cfg.text, cx + fs * 1.5, cy);
  } else if (cfg.icon) {
    ctx.font = `bold ${d * 0.4}px Arial`;
    ctx.fillText(cfg.icon, cx, cy);
  } else if (cfg.text) {
    ctx.fillText(cfg.text, cx, cy);
  }
  ctx.globalAlpha = 1;
}

function drawWatermark(ctx, wm, W, H) {
  if (!wm || !wm.enabled || !wm.text) return;
  const fontSize = Math.round(W * (wm.sizePct ?? 4) / 100);
  ctx.save();
  ctx.globalAlpha = (wm.opacity ?? 25) / 100;
  ctx.fillStyle = wm.color || '#000000';
  ctx.font = `${wm.bold ? 'bold ' : ''}${fontSize}px ${wm.font || 'Inter'}, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (wm.mode === 'diagonal') {
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    const step = ctx.measureText(wm.text).width + fontSize * 2;
    for (let yy = -H; yy <= H; yy += fontSize * 4) {
      for (let xx = -W; xx <= W; xx += step) ctx.fillText(wm.text, xx, yy);
    }
  } else {
    const margin = Math.round(W * 0.03);
    const pos = {
      'top-left': [margin + ctx.measureText(wm.text).width / 2, margin + fontSize / 2],
      'top-right': [W - margin - ctx.measureText(wm.text).width / 2, margin + fontSize / 2],
      'bottom-left': [margin + ctx.measureText(wm.text).width / 2, H - margin - fontSize / 2],
      'bottom-center': [W / 2, H - margin - fontSize / 2],
      'bottom-right': [W - margin - ctx.measureText(wm.text).width / 2, H - margin - fontSize / 2],
    }[wm.position || 'bottom-center'];
    ctx.fillText(wm.text, pos[0], pos[1]);
  }
  ctx.restore();
}

// Premium: simple flood-fill background removal for near-uniform backgrounds
function removeBackground(img, tolerance = 40) {
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const { width: W, height: H } = c;
  const px = data.data;
  const sample = [px.slice(0, 4), px.slice((W - 1) * 4, W * 4), px.slice((H - 1) * W * 4, (H - 1) * W * 4 + 4)];
  let bg = [0, 0, 0];
  for (const s of sample) for (let i = 0; i < 3; i++) bg[i] += s[i];
  bg = bg.map((v) => v / sample.length);
  const dist = (i) => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
  const seen = new Uint8Array(W * H);
  const stack = [];
  const pushIfBg = (p) => {
    if (p >= 0 && p < W * H && !seen[p] && dist(p * 4) <= tolerance * 3) {
      seen[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < W; x++) { pushIfBg(x); pushIfBg((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { pushIfBg(y * W); pushIfBg(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    px[p * 4 + 3] = 0;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) pushIfBg(p - 1);
    if (x < W - 1) pushIfBg(p + 1);
    if (y > 0) pushIfBg(p - W);
    if (y < H - 1) pushIfBg(p + W);
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

// Premium: auto-detect tight bounding box of non-white content
function detectContentBox(img) {
  const step = 4;
  const c = document.createElement('canvas');
  c.width = Math.ceil(img.width / step);
  c.height = Math.ceil(img.height / step);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, minY = c.height, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const alpha = d[i + 3];
      const isContent = alpha < 200 || (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235);
      if (isContent) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;
  return { x: minX * step, y: minY * step, w: (maxX - minX) * step, h: (maxY - minY) * step };
}

/* ---------------- core renderer ---------------- */

export async function renderVariant(img, variant, opts) {
  const {
    platformKey = 'meesho',
    width = 1200,
    height = 1200,
    stickersAllowed = true,
    compress = true,
    targetKB = 100,
    quality = 0.92,
    format = 'jpeg',
    background = '#FFFFFF',
    borderScale = 1,
    paddingScale = 1,
    cornerScale = 1,
    brandColor = null,
    watermark = null,
    removeBg = false,
    autoCrop = false,
    brightness = 0,
    contrast = 0,
    saturation = 0,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const borderWidth = Math.round((variant.borderWidth / 100) * width * borderScale);
  const padding = Math.round((variant.padding / 100) * width * paddingScale);
  const inset = borderWidth + padding;
  let areaW = width - inset * 2;
  let areaH = height - inset * 2;
  let drawX = inset;
  const drawY = inset;

  // Work on a possibly pre-processed source image
  let srcImg = img;
  let box = null;
  if (removeBg) {
    const cut = removeBackground(img);
    srcImg = cut;
    box = detectContentBox(cut);
    if (box && (box.w < cut.width * 0.98 || box.h < cut.height * 0.98)) {
      const cropped = document.createElement('canvas');
      cropped.width = Math.max(1, box.w);
      cropped.height = Math.max(1, box.h);
      cropped.getContext('2d').drawImage(cut, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      srcImg = cropped;
    }
  } else if (autoCrop) {
    box = detectContentBox(img);
    if (box && (box.w < img.width * 0.97 || box.h < img.height * 0.97)) {
      const cropped = document.createElement('canvas');
      cropped.width = Math.max(1, box.w);
      cropped.height = Math.max(1, box.h);
      cropped.getContext('2d').drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      srcImg = cropped;
    }
  }

  // Frame shift variants
  if (variant.cropShift) {
    const j = Math.round((variant.cropShift.amount / 100) * width);
    drawX += variant.cropShift.direction === 'left' ? -j / 2 : j / 2;
  }

  const color = variant.borderColor && variant.borderColor !== PALETTE.white && brandColor ? brandColor : variant.borderColor;

  // Borders
  if (borderWidth > 0 && color) {
    const radius = Math.round(variant.borderRadius * cornerScale);
    if (radius > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, radius);
      ctx.fill();
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.roundRect(borderWidth, borderWidth, width - borderWidth * 2, height - borderWidth * 2, Math.max(0, radius - borderWidth));
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, borderWidth);
      ctx.fillRect(0, height - borderWidth, width, borderWidth);
      ctx.fillRect(0, 0, borderWidth, height);
      ctx.fillRect(width - borderWidth, 0, borderWidth, height);
    }
  }

  // Fit image into area preserving aspect ratio
  const srcW = srcImg.naturalWidth || srcImg.width;
  const srcH = srcImg.naturalHeight || srcImg.height;
  const srcRatio = srcW / srcH;
  const areaRatio = areaW / areaH;
  let w, h;
  if (srcRatio > areaRatio) { w = areaW; h = areaW / srcRatio; } else { h = areaH; w = areaH * srcRatio; }
  const x = drawX + (areaW - w) / 2;
  const y = drawY + (areaH - h) / 2;

  const radius = Math.round(variant.borderRadius * cornerScale);
  if (radius > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.clip();
  }

  // Premium tone adjustments
  const filters = [];
  if (brightness) filters.push(`brightness(${1 + brightness / 100})`);
  if (contrast) filters.push(`contrast(${1 + contrast / 100})`);
  if (saturation) filters.push(`saturate(${1 + saturation / 100})`);
  if (filters.length) ctx.filter = filters.join(' ');

  ctx.drawImage(srcImg, x, y, w, h);
  ctx.filter = 'none';
  if (radius > 0) ctx.restore();

  // Stickers
  if (variant.sticker && stickersAllowed) {
    drawSticker(ctx, variant.sticker.type, variant.sticker.position, width, { x, y, width: w, height: h });
  }

  // Watermark (premium)
  drawWatermark(ctx, watermark, width, height);

  // Encode
  let blob;
  let usedQuality = quality;
  if (format === 'png') {
    blob = await canvasToBlob(canvas, 'image/png');
  } else if (compress) {
    const res = await compressUnderKB(canvas, targetKB, quality);
    blob = res.blob;
    usedQuality = res.quality;
  } else {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  const dataUrl = await blobToDataURL(blob);
  const sizeKB = Math.round(blob.size / 1024);
  return {
    id: variant.id,
    name: variant.name,
    group: variant.group,
    dataUrl,
    blob,
    sizeKB,
    qualifiesLowShipping: sizeKB <= targetKB,
    jpegQuality: usedQuality,
    width,
    height,
  };
}

/* ---------------- variant builder (base + premium customs) ---------------- */

export function buildVariants(baseList, settings) {
  const list = [...baseList];
  if (settings.customBorders?.enabled) {
    for (const cb of settings.customBorders.items || []) {
      list.push({
        id: `custom-border-${cb.uid}`,
        name: cb.name || 'Custom Border',
        group: 'custom',
        borderWidth: cb.width,
        borderColor: cb.color,
        padding: cb.padding ?? 3,
        borderRadius: cb.radius ?? 0,
      });
    }
  }
  if (settings.customStickers?.enabled) {
    for (const cs of settings.customStickers.items || []) {
      list.push({
        id: `custom-sticker-${cs.uid}`,
        name: cs.label ? `${cs.label} Badge` : 'Custom Badge',
        group: 'micro-sticker',
        borderWidth: 0, borderColor: '', padding: 5, borderRadius: 0,
        sticker: { type: cs.type, position: cs.position },
      });
    }
  }
  if (settings.frameShift?.enabled) {
    const n = settings.frameShift.count ?? 2;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 === 0 ? 'left' : 'right';
      const amt = 2 + (i >> 1);
      list.push({
        id: `custom-shift-${i}`,
        name: `${dir === 'left' ? 'Left' : 'Right'} Shift ${amt}%`,
        group: 'frame-shift',
        borderWidth: 0, borderColor: '', padding: 4, borderRadius: 0,
        cropShift: { direction: dir, amount: amt },
      });
    }
  }
  return list;
}

export async function generateAll(file, variants, settings, onProgress) {
  const img = await loadImage(file);
  const results = [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const r = await renderVariant(img, v, {
      width: settings.width,
      height: settings.height,
      stickersAllowed: settings.stickersAllowed,
      compress: settings.compress,
      targetKB: settings.targetKB,
      quality: settings.quality,
      format: settings.format,
      background: settings.background,
      brandColor: settings.brandColor,
      watermark: settings.watermark,
      removeBg: settings.removeBg,
      autoCrop: settings.autoCrop,
      brightness: settings.brightness,
      contrast: settings.contrast,
      saturation: settings.saturation,
    });
    results.push(r);
    if (onProgress) onProgress(Math.round(((i + 1) / variants.length) * 100));
    // yield to keep UI responsive
    if (i % 3 === 2) await new Promise((res) => setTimeout(res, 0));
  }
  URL.revokeObjectURL(img.src);
  return results;
}

/* ---------------- downloads ---------------- */

export function downloadOne(v, filename) {
  const a = document.createElement('a');
  a.href = v.dataUrl;
  a.download = filename || `${v.group}-${v.id}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadZip(variants, platform = 'meesho') {
  if (!window.JSZip) throw new Error('JSZip not loaded');
  const zip = new window.JSZip();
  const folders = {};
  for (const v of variants) {
    const key = v.group;
    folders[key] = folders[key] || zip.folder(key);
    const sizeTag = v.sizeKB ? `-${v.sizeKB}kb` : '';
    folders[key].file(`${v.id}${sizeTag}.jpg`, v.blob, { binary: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${platform}-image-variants.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
