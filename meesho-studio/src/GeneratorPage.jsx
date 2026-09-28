import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MEESHO_BASE_VARIANTS, AMAZON_BASE_VARIANTS, PRESETS, STICKERS, PALETTE,
  buildVariants, generateAll, downloadOne, downloadZip,
} from './lib/engine.js';
import { Dropzone, VariantGrid, Field, Switch, Range, GroupBadge, useToasts } from './ui.jsx';

const DEFAULT_SETTINGS = {
  platform: 'meesho',
  width: 1200,
  height: 1200,
  format: 'jpeg',
  compress: true,
  targetKB: 100,
  quality: 0.92,
  background: '#FFFFFF',
  borderScale: 1,
  paddingScale: 1,
  cornerScale: 1,
  brandColor: null,
  removeBg: false,
  autoCrop: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  watermark: { enabled: false, text: '', mode: 'corner', position: 'bottom-center', opacity: 25, sizePct: 4, color: '#000000', bold: true },
  customBorders: { enabled: false, items: [] },
  customStickers: { enabled: false, items: [{ uid: 's1', type: 'cod', position: 'top-right' }, { uid: 's2', type: 'free-shipping', position: 'bottom-left' }] },
  frameShift: { enabled: false, count: 4 },
};

const SETTINGS_KEY = 'mspro_settings_v1';

export default function GeneratorPage({ isPro, goPro, toast }) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const patch = useCallback((p) => setSettings((s) => ({ ...s, ...p })), []);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const preset = PRESETS[settings.platform];
  const baseList = settings.platform === 'amazon' ? AMAZON_BASE_VARIANTS : MEESHO_BASE_VARIANTS;

  /* effective settings — premium overrides locked for free users */
  const eff = useMemo(() => {
    if (isPro) return settings;
    return {
      ...DEFAULT_SETTINGS,
      platform: settings.platform,
      width: preset.dimensions.width,
      height: preset.dimensions.height,
      stickersAllowed: preset.stickersAllowed,
    };
  }, [isPro, settings, preset]);

  const variants = useMemo(() => buildVariants(baseList, eff), [baseList, eff]);

  /* upload + generation state */
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);           // active image results
  const [bulkResults, setBulkResults] = useState([]);   // {name, results[]} per file
  const [selected, setSelected] = useState(new Set());
  const [sortBySize, setSortBySize] = useState(false);
  const resultsRef = useRef(null);

  const onSelect = useCallback((f) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResults([]); setBulkResults([]); setSelected(new Set());
  }, []);
  const onRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(null); setResults([]); setSelected(new Set());
  }, [previewUrl]);

  const onBulkSelect = useCallback((fs) => {
    if (!isPro) { goPro('Bulk generation'); return; }
    setBulkFiles(fs.slice(0, 10));
    setFile(null); setPreviewUrl(null); setResults([]); setBulkResults([]);
  }, [isPro, goPro]);

  const toggleSelect = useCallback((id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);
  const selectAll = useCallback(() => {
    setSelected((s) => (s.size === variants.length ? new Set() : new Set(results.map((r) => r.id))));
  }, [variants.length, results]);

  const generate = useCallback(async () => {
    if (!file && bulkFiles.length === 0) { toast('Please upload an image first', true); return; }
    setGenerating(true); setProgress(0); setResults([]); setBulkResults([]); setSelected(new Set());
    try {
      if (bulkFiles.length > 0) {
        const all = [];
        for (let i = 0; i < bulkFiles.length; i++) {
          const f = bulkFiles[i];
          const rs = await generateAll(f, variants, eff, (p) =>
            setProgress(Math.round(((i + p / 100) / bulkFiles.length) * 100)));
          all.push({ name: f.name, results: rs });
        }
        setBulkResults(all);
        toast(`Generated ${all.reduce((a, b) => a + b.results.length, 0)} images across ${all.length} products!`);
      } else {
        const rs = await generateAll(file, variants, eff, setProgress);
        setResults(rs);
        toast(`Generated ${rs.length} image variants!`);
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      console.error(e);
      toast('Generation failed. Please try again.', true);
    } finally {
      setGenerating(false);
    }
  }, [file, bulkFiles, variants, eff, toast]);

  const downloadSelectedZip = useCallback(async (listOverride) => {
    const pool = listOverride || results;
    const chosen = selected.size > 0 ? pool.filter((v) => selected.has(v.id)) : pool;
    if (!chosen.length) { toast('No images to download', true); return; }
    try {
      await downloadZip(chosen, settings.platform);
      toast('ZIP downloaded successfully!');
    } catch { toast('Failed to create ZIP file', true); }
  }, [results, selected, settings.platform, toast]);

  const downloadBulkZip = useCallback(async () => {
    if (!isPro) { goPro('Bulk ZIP export'); return; }
    const flat = bulkResults.flatMap((b) => b.results);
    if (!flat.length) return;
    try { await downloadZip(flat, settings.platform); toast('Bulk ZIP downloaded!'); }
    catch { toast('ZIP failed', true); }
  }, [bulkResults, isPro, goPro, settings.platform, toast]);

  const displayed = sortBySize ? [...results].sort((a, b) => a.sizeKB - b.sizeKB) : results;
  const qualifying = results.filter((r) => r.qualifiesLowShipping).length;

  /* ------------------------------------------------------------------ */
  return (
    <div className="container">
      {/* headline card */}
      <div className="card" style={{ marginTop: 26, border: '1px solid rgba(139,92,246,.3)', background: 'linear-gradient(120deg, rgba(139,92,246,.12), var(--card) 60%)' }}>
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', padding: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
              ⚡ Meesho Low-Shipping Image Generator
              {!isPro && <span className="pill pro">Free tier</span>}
              {isPro && <span className="pill new">Pro unlocked</span>}
            </h3>
            <p className="sub">Generate optimized {eff.width}×{eff.height} product images that help reduce Meesho shipping charges — instant, in-browser, private.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pill free">FREE CORE</span>
            <span className="pill">{variants.length} IMAGES</span>
          </div>
        </div>
      </div>

      {/* steps */}
      <div className="steps">
        {[['📤', 'Upload', 'Product photo'], ['⚙️', 'Configure', 'Premium controls'], ['✨', 'Generate', `${variants.length} variants`], ['📦', 'Download', 'JPG or ZIP']].map(([ic, t, d]) => (
          <div className="step" key={t}><div className="ic">{ic}</div><b>{t}</b><small>{d}</small></div>
        ))}
      </div>

      <div className="workspace">
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="head"><h3>Upload Product Image</h3><p className="sub">Clean, centered product photo on a light background works best.</p></div>
            <div className="body">
              {bulkFiles.length > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {bulkFiles.map((f, i) => (
                      <span key={i} className="pill" style={{ textTransform: 'none' }}>
                        {f.name.slice(0, 22)}{' '}
                        <button style={{ all: 'unset', cursor: 'pointer', color: 'var(--rose)' }} onClick={() => setBulkFiles(bulkFiles.filter((_, j) => j !== i))}>✕</button>
                      </span>
                    ))}
                  </div>
                  <p className="file-meta">{bulkFiles.length} of 10 products queued (Pro)</p>
                  <button className="btn outline sm" style={{ marginTop: 8 }} onClick={() => { setBulkFiles([]); }}>Switch to single image</button>
                </>
              ) : (
                <Dropzone file={file} previewUrl={previewUrl} onSelect={onSelect} onRemove={onRemove} disabled={generating} />
              )}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
                  🗂 Bulk upload (up to 10){!isPro && ' 🔒'}
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files?.length && onBulkSelect(Array.from(e.target.files))} />
                </label>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <div className="head"><h3>Premium Studio Controls</h3><p className="sub">{isPro ? 'All features unlocked.' : 'Free plan uses the standard Meesho recipe. Upgrade to unlock everything below.'}</p></div>
            <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className={`callout`} style={{ marginBottom: 8 }}>
                <b>Low-Shipping Mode: ON</b> — {eff.width}×{eff.height}, {eff.compress ? `auto-compressed under ${eff.targetKB} KB` : 'full quality export'}
              </div>

              <div className="controls">
                <Field label="Platform preset">
                  <select value={settings.platform} onChange={(e) => {
                    const p = e.target.value;
                    patch({ platform: p, width: PRESETS[p].dimensions.width, height: PRESETS[p].dimensions.height });
                  }}>
                    <option value="meesho">Meesho (1200×1200, 20 variants)</option>
                    <option value="amazon">Amazon (1600×1600, 5 variants)</option>
                  </select>
                </Field>
                <Field label={`Output width ${!isPro && '🔒'}`}>
                  <input type="number" min={600} max={3000} step={100} disabled={!isPro} value={settings.width} onChange={(e) => patch({ width: Number(e.target.value) })} />
                </Field>
                <Field label={`Output height ${!isPro && '🔒'}`}>
                  <input type="number" min={600} max={3000} step={100} disabled={!isPro} value={settings.height} onChange={(e) => patch({ height: Number(e.target.value) })} />
                </Field>
                <Field label={`Format ${!isPro && '🔒'}`}>
                  <select disabled={!isPro} value={settings.format} onChange={(e) => patch({ format: e.target.value })}>
                    <option value="jpeg">JPEG (compressed)</option>
                    <option value="png">PNG (lossless)</option>
                  </select>
                </Field>
                <Field label={`Target size (KB) ${!isPro && '🔒'}`}>
                  <Range value={settings.targetKB} onChange={(v) => patch({ targetKB: v })} min={50} max={500} step={10} suffix=" KB" />
                </Field>
                <Field label={`Background colour ${!isPro && '🔒'}`}>
                  <input type="color" disabled={!isPro} value={settings.background} onChange={(e) => patch({ background: e.target.value })} />
                </Field>
              </div>

              {/* Premium accordions */}
              <details className="acc" open={false}>
                <summary>🎨 Brand &amp; styling <span className="pill pro" style={{ marginLeft: 8 }}>PRO</span><span className="chev">›</span></summary>
                <div className="acc-body">
                  <div className="controls" style={{ marginTop: 10 }}>
                    <Field label="Brand border colour">
                      <input type="color" disabled={!isPro} value={settings.brandColor || '#8B5CF6'} onChange={(e) => patch({ brandColor: e.target.value })} />
                    </Field>
                    <Field label="Border thickness">
                      <Range value={Math.round(settings.borderScale * 100)} onChange={(v) => patch({ borderScale: v / 100 })} min={0} max={300} suffix="%" />
                    </Field>
                    <Field label="Padding scale">
                      <Range value={Math.round(settings.paddingScale * 100)} onChange={(v) => patch({ paddingScale: v / 100 })} min={0} max={300} suffix="%" />
                    </Field>
                    <Field label="Corner radius scale">
                      <Range value={Math.round(settings.cornerScale * 100)} onChange={(v) => patch({ cornerScale: v / 100 })} min={0} max={400} suffix="%" />
                    </Field>
                    <Field label="Brightness">
                      <Range value={settings.brightness} onChange={(v) => patch({ brightness: v })} min={-40} max={40} suffix="%" />
                    </Field>
                    <Field label="Contrast">
                      <Range value={settings.contrast} onChange={(v) => patch({ contrast: v })} min={-40} max={40} suffix="%" />
                    </Field>
                    <Field label="Saturation">
                      <Range value={settings.saturation} onChange={(v) => patch({ saturation: v })} min={-60} max={60} suffix="%" />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <Switch checked={settings.removeBg} onChange={(v) => patch({ removeBg: v })} label="Auto background removal 🔒" />
                    <Switch checked={settings.autoCrop} onChange={(v) => patch({ autoCrop: v })} label="Smart auto-crop 🔒" />
                  </div>
                  {!isPro && <button className="btn hero sm" style={{ marginTop: 12 }} onClick={() => goPro('Brand & styling')}>Unlock with Pro</button>}
                </div>
              </details>

              <details className="acc">
                <summary>💧 Watermark studio <span className="pill pro" style={{ marginLeft: 8 }}>PRO</span><span className="chev">›</span></summary>
                <div className="acc-body">
                  <div style={{ marginTop: 10 }}>
                    <Switch checked={settings.watermark.enabled} onChange={(v) => patch({ watermark: { ...settings.watermark, enabled: v } })} label="Enable watermark 🔒" />
                  </div>
                  {settings.watermark.enabled && (
                    <div className="controls" style={{ marginTop: 12 }}>
                      <Field label="Watermark text">
                        <input type="text" disabled={!isPro} placeholder="YourBrand.in" value={settings.watermark.text} onChange={(e) => patch({ watermark: { ...settings.watermark, text: e.target.value } })} />
                      </Field>
                      <Field label="Style">
                        <select disabled={!isPro} value={settings.watermark.mode} onChange={(e) => patch({ watermark: { ...settings.watermark, mode: e.target.value } })}>
                          <option value="corner">Single corner</option>
                          <option value="diagonal">Diagonal tiled</option>
                        </select>
                      </Field>
                      <Field label="Position">
                        <select disabled={!isPro} value={settings.watermark.position} onChange={(e) => patch({ watermark: { ...settings.watermark, position: e.target.value } })}>
                          {['top-left', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                      <Field label="Colour">
                        <input type="color" disabled={!isPro} value={settings.watermark.color} onChange={(e) => patch({ watermark: { ...settings.watermark, color: e.target.value } })} />
                      </Field>
                      <Field label="Opacity">
                        <Range value={settings.watermark.opacity} onChange={(v) => patch({ watermark: { ...settings.watermark, opacity: v } })} min={5} max={80} suffix="%" />
                      </Field>
                      <Field label="Size">
                        <Range value={settings.watermark.sizePct} onChange={(v) => patch({ watermark: { ...settings.watermark, sizePct: v } })} min={2} max={10} suffix="%" />
                      </Field>
                    </div>
                  )}
                  {!isPro && <button className="btn hero sm" style={{ marginTop: 12 }} onClick={() => goPro('Watermark studio')}>Unlock with Pro</button>}
                </div>
              </details>

              <details className="acc">
                <summary>➕ Extra variant packs <span className="pill pro" style={{ marginLeft: 8 }}>PRO</span><span className="chev">›</span></summary>
                <div className="acc-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <Switch checked={settings.customStickers.enabled} onChange={(v) => patch({ customStickers: { ...settings.customStickers, enabled: v } })} label="+ COD & Free-Shipping badges (2 extra)" />
                    <Switch checked={settings.frameShift.enabled} onChange={(v) => patch({ frameShift: { ...settings.frameShift, enabled: v } })} label="+ Extended frame-shift pack (4 extra)" />
                    <Switch checked={settings.customBorders.enabled} onChange={(v) => patch({ customBorders: { ...settings.customBorders, enabled: v, items: settings.customBorders.items.length ? settings.customBorders.items : [{ uid: 'b1', name: 'Brand Solid', width: 5, color: settings.brandColor || '#8B5CF6', padding: 3, radius: 0 }, { uid: 'b2', name: 'Brand Rounded', width: 3, color: settings.brandColor || '#8B5CF6', padding: 4, radius: 24 }] } })} label="+ Custom brand-border variants (2 extra)" />
                  </div>
                  {!isPro && <button className="btn hero sm" style={{ marginTop: 12 }} onClick={() => goPro('Extra variant packs')}>Unlock with Pro</button>}
                </div>
              </details>

              <button
                className="btn hero lg"
                style={{ marginTop: 14 }}
                onClick={generate}
                disabled={(!file && !bulkFiles.length) || generating}
              >
                {generating ? `Generating… ${progress}%` : `✨ Generate ${variants.length} Low-Shipping Images`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {generating && (
            <div className="card">
              <div className="body">
                <p style={{ fontWeight: 600, marginBottom: 10 }}>Building your variants…</p>
                <div className="progressbar"><div className="fill" style={{ width: `${progress}%` }} /></div>
                <p className="sub" style={{ marginTop: 8 }}>{Math.round((progress / 100) * variants.length)} / {variants.length} rendered</p>
              </div>
            </div>
          )}

          {!generating && results.length === 0 && bulkResults.length === 0 && (
            <div className="card" style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🖼️</div>
                <h3>Reduce Your Meesho Shipping Charges</h3>
                <p className="sub" style={{ maxWidth: 340, margin: '8px auto 14px' }}>
                  Upload a product image to generate {variants.length} optimized variants with lower estimated shipping costs.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  <span>✓ Free core</span><span>✓ No login</span><span>✓ Instant</span><span>✓ 100% private</span>
                </div>
              </div>
            </div>
          )}

          {!generating && results.length > 0 && (
            <div className="card" ref={resultsRef}>
              <div className="head" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <h3>Generated Variants</h3>
                  <p className="sub">{selected.size > 0 ? `${selected.size} selected` : 'Tap to select, then download'} · {qualifying}/{results.length} qualify as low-shipping</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Switch checked={sortBySize} onChange={setSortBySize} label="Sort by size" />
                  <button className="btn hero sm" onClick={() => downloadSelectedZip()}>📦 Download ZIP</button>
                </div>
              </div>
              <div className="body">
                <VariantGrid variants={displayed} selected={selected} onToggle={toggleSelect} onSelectAll={selectAll} pro={isPro} />
              </div>
            </div>
          )}

          {!generating && bulkResults.length > 0 && (
            <div className="card" ref={resultsRef}>
              <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3>Bulk Results — {bulkResults.length} products</h3>
                  <p className="sub">{bulkResults.reduce((a, b) => a + b.results.length, 0)} images generated</p>
                </div>
                <button className="btn hero sm" onClick={downloadBulkZip}>📦 Download All (ZIP)</button>
              </div>
              <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {bulkResults.map((b) => (
                  <div key={b.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ fontSize: 13.5 }}>📦 {b.name}</strong>
                      <button className="btn outline sm" onClick={() => downloadZip(b.results, settings.platform)}>ZIP</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                      {b.results.slice(0, 10).map((v) => (
                        <img key={v.id} src={v.dataUrl} title={`${v.name} · ${v.sizeKB} KB`} alt={v.name}
                          style={{ height: 92, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: '#fff' }}
                          onClick={() => downloadOne(v, `${v.name.replace(/\s+/g, '-').toLowerCase()}.jpg`)} />
                      ))}
                      {b.results.length > 10 && <div style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: 12 }}>+{b.results.length - 10} more</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!generating && results.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(139,92,246,.35)', background: 'linear-gradient(120deg, rgba(139,92,246,.1), var(--card) 70%)' }}>
              <div className="body" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 30 }}>🚀</div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <b>Create the full listing next</b>
                  <p className="sub">Write an SEO-optimized Meesho title, description and keywords for this product.</p>
                </div>
                <button className="btn hero sm" onClick={() => toast('Listing generator coming in Studio Pro v2 ✨')}>Generate Listing →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What you get */}
      <div className="section">
        <h2>What You Get</h2>
        <div className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {[
            ['emerald', '12 Clean Optimized', 'Borders, padding & rounded-corner recipes · Est. ₹30–₹55 shipping'],
            ['amber', '6 Micro-Sticker', 'Trusted / Best Seller / Rating badges · Est. ₹35–₹60'],
            ['blue', '2 Frame Shift', 'Subtle crop shifts past duplicate detection · Est. ₹25–₹50'],
            ['violet', '∞ Premium Packs', 'Custom brand borders, watermarks, bulk mode & PNG export (Pro)'],
          ].map(([c, t, d]) => (
            <div key={t} className={`card`} style={{ padding: 16 }}>
              <GroupBadge group={c === 'violet' ? 'custom' : c === 'emerald' ? 'clean' : c === 'amber' ? 'micro-sticker' : 'frame-shift'} />
              <b style={{ display: 'block', margin: '8px 0 4px' }}>{t}</b>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO prose */}
      <div className="section">
        <h2>How the Meesho Low Shipping Image Generator Works</h2>
        <p className="lead">Our tool creates {variants.length} optimized product image variants from your original photo. By adjusting image padding, borders and dimensions to exactly {eff.width}×{eff.height} pixels and auto-compressing files under {eff.targetKB} KB, it helps reduce the volumetric-weight calculations Meesho uses to estimate shipping — potentially saving ₹10–₹40 per order while keeping your catalog looking professional. Everything runs locally in your browser: your images never leave your device.</p>
      </div>
      <div className="section">
        <h2>Why Use a Low-Shipping Image Generator for Meesho?</h2>
        <p className="lead">Meesho bills shipping on the higher of actual and volumetric weight (L × B × H ÷ 5000), plus 18% GST, plus roughly 50% of the forward fee when an order returns as RTO. Sellers who ship inside the lightest slab and split variants into separate, individually photographed SKUs see the biggest savings — and that is exactly what these optimized images are built for.</p>
      </div>

      <div className="disclaimer">
        <b>Disclaimer:</b> This tool generates image variants using rule-based processing only. Estimated shipping ranges are approximate and may vary based on product category, weight and Meesho's pricing. We do not guarantee specific shipping cost reductions. This is an independent educational clone built for demonstration purposes.
      </div>
    </div>
  );
}
