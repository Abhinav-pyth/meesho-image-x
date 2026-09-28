import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  MEESHO_BASE_VARIANTS, AMAZON_BASE_VARIANTS, PRESETS, GROUP_META, SHIPPING_ESTIMATES,
  STICKERS, PALETTE, buildVariants, generateAll, downloadOne, downloadZip,
} from './lib/engine.js';

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { msg, err, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const node = (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.err ? 'err' : ''}`}>{t.msg}</div>
      ))}
    </div>
  );
  return { push, node };
}

/* ------------------------------------------------------------------ */
/* Premium gate hook (localStorage-based demo auth)                    */
/* ------------------------------------------------------------------ */
const PLAN_KEY = 'mspro_plan';
export function usePlan() {
  const [plan, setPlanState] = useState(() => localStorage.getItem(PLAN_KEY) || 'free');
  const setPlan = useCallback((p) => {
    localStorage.setItem(PLAN_KEY, p);
    setPlanState(p);
  }, []);
  const isPro = plan === 'pro';
  return { plan, setPlan, isPro };
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */
export const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

export const Switch = ({ checked, onChange, label }) => (
  <label className="switch">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

export const Range = ({ value, onChange, min, max, step = 1, suffix = '' }) => (
  <div>
    <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
      <span className="val" style={{ color: 'var(--primary-2)', fontWeight: 700 }}>{value}{suffix}</span>
    </div>
  </div>
);

export const GroupBadge = ({ group }) => (
  <span className={`badge-group bg-${GROUP_META[group]?.color || 'violet'}`}>
    {GROUP_META[group]?.label || group}
  </span>
);

/* ------------------------------------------------------------------ */
/* Dropzone                                                            */
/* ------------------------------------------------------------------ */
export function Dropzone({ file, previewUrl, onSelect, onRemove, disabled, multiple = false }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((flist) => {
    const files = Array.from(flist || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) return { error: 'Images must be under 10MB' };
    onSelect(multiple ? files : files[0]);
  }, [onSelect, multiple]);

  if (file && previewUrl) {
    return (
      <>
        <div className="preview-wrap">
          <img src={previewUrl} alt="Selected product" />
          {!disabled && (
            <button className="rm" onClick={onRemove} aria-label="Remove image">✕</button>
          )}
        </div>
        <p className="file-meta">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
      </>
    );
  }
  return (
    <label
      className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        if (disabled) return;
        const r = handleFiles(e.dataTransfer.files);
        if (r?.error) return;
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="dz-ic">📷</div>
      <b>Click to upload or drag &amp; drop</b>
      <span>Product photo — JPG, PNG, WebP (max 10 MB)</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Variant grid + modal                                                */
/* ------------------------------------------------------------------ */
export function VariantGrid({ variants, selected, onToggle, onSelectAll, pro }) {
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null);
  const groups = useMemo(() => {
    const g = {};
    for (const v of variants) g[v.group] = (g[v.group] || 0) + 1;
    return g;
  }, [variants]);
  const shown = tab === 'all' ? variants : variants.filter((v) => v.group === tab);

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All ({variants.length})</button>
        {Object.entries(groups).map(([g, n]) => (
          <button key={g} className={`tab ${tab === g ? 'active' : ''}`} onClick={() => setTab(g)}>
            {GROUP_META[g]?.label || g} ({n})
          </button>
        ))}
      </div>
      <div className="vgrid">
        {shown.map((v) => {
          const est = SHIPPING_ESTIMATES[v.group] || SHIPPING_ESTIMATES.clean;
          const sel = selected.has(v.id);
          return (
            <div key={v.id} className={`vcard ${sel ? 'selected' : ''}`} onClick={() => onToggle(v.id)}>
              <div className="thumb">
                <img src={v.dataUrl} alt={`${v.name} — Meesho optimized product image`} loading="lazy" />
                {sel && <div className="selmark">✓</div>}
                <button
                  className="dl"
                  title="Download this image"
                  onClick={(e) => { e.stopPropagation(); downloadOne(v, `${v.name.replace(/\s+/g, '-').toLowerCase()}.jpg`); }}
                >⬇</button>
              </div>
              <div className="meta">
                <div className="row">
                  <GroupBadge group={v.group} />
                  <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setModal(v); }}>Preview</button>
                </div>
                <p className="name" title={v.name}>{v.name}</p>
                <div className="kbtags">
                  <span className={`kb ${v.qualifiesLowShipping ? 'ok' : 'warn'}`}>
                    {v.qualifiesLowShipping ? `✓ ${v.sizeKB} KB — Low Shipping` : `⚠ ${v.sizeKB} KB`}
                  </span>
                  <span className="kb est">{est.range}</span>
                  {pro && <span className="kb est">q{(v.jpegQuality * 100).toFixed(0)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div className="modal-back" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{modal.name}</strong>
                <GroupBadge group={modal.group} />
                <span className="kb ok">{modal.width}×{modal.height}px · {modal.sizeKB} KB</span>
                <span className="kb est">{(SHIPPING_ESTIMATES[modal.group] || SHIPPING_ESTIMATES.clean).label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn hero sm" onClick={() => downloadOne(modal, `${modal.name.replace(/\s+/g, '-').toLowerCase()}.jpg`)}>⬇ Download</button>
                <button className="btn outline sm" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
            <img src={modal.dataUrl} alt={`${modal.name} full preview`} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn outline" onClick={onSelectAll}>
          {selected.size === variants.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
    </div>
  );
}

export { PALETTE, STICKERS, PRESETS, MEESHO_BASE_VARIANTS, AMAZON_BASE_VARIANTS, buildVariants, generateAll, downloadZip };
