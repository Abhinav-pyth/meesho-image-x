import React, { useEffect, useState } from 'react';
import GeneratorPage from './GeneratorPage.jsx';
import ShippingGuidePage from './ShippingGuidePage.jsx';
import { useToasts, usePlan } from './ui.jsx';

const ROUTES = ['generator', 'shipping', 'pricing'];

const TOOL_FAQ = [
  { q: 'Is this Meesho image generator free?', a: 'Yes — the core generator is 100% free with unlimited generations. No signup, no credit card, no hidden charges. Premium features like bulk mode, watermarks and custom sizes are part of the Pro plan.' },
  { q: 'How does this tool reduce Meesho shipping charges?', a: 'By optimizing image dimensions to 1200×1200px with strategic padding, borders and file-size compression under 100 KB, the tool creates variants aligned with the lighter volumetric-weight brackets Meesho uses for shipping estimation.' },
  { q: 'How many image variants are generated?', a: '20 optimized variants per image on Meesho — 12 clean optimizations, 6 micro-sticker badges and 2 frame-shift crops — each tagged with its file size and estimated shipping range. Pro adds extra badge and border packs.' },
  { q: 'Do I need to sign up to use this tool?', a: 'No login or signup required. Upload your image and start generating instantly — everything runs completely in your browser, so your photos never leave your device.' },
  { q: 'Can I use this tool for other marketplaces?', a: 'Yes — the built-in platform switcher includes an Amazon preset (1600×1600, 5 clean padding variants, stickers disabled to respect Amazon policy).' },
  { q: 'Are the estimated shipping costs guaranteed?', a: 'No. Estimates are approximate ranges based on publicly documented Meesho rates; actual charges depend on your parcel weight, dimensions, category and live Supplier Panel rates.' },
];

function Hero({ navigate }) {
  return (
    <div className="hero">
      <span className="pill new" style={{ marginBottom: 14 }}>Premium clone · v2.0</span>
      <h1>
        Meesho Low Shipping<br />
        <span className="grad">Image Generator</span> Studio
      </h1>
      <p>
        Turn one product photo into {`20+`} shipping-optimized catalog images — auto-compressed under 100 KB,
        branded borders, trust badges, watermarks and bulk mode. Free core, no signup, 100% in-browser.
      </p>
      <div className="trust">
        <span>Free forever core</span><span>No login needed</span><span>Instant results</span><span>Private by design</span>
      </div>
      <div style={{ marginTop: 22, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn hero lg" onClick={() => { navigate('generator'); setTimeout(() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
          🚀 Start Generating — It's Free
        </button>
        <button className="btn outline lg" onClick={() => navigate('shipping')}>📊 Shipping Charges Guide</button>
      </div>
    </div>
  );
}

function Pricing({ plan, setPlan, toast }) {
  const plans = [
    {
      id: 'free', name: 'Free', price: '₹0', period: '/forever', cta: 'Start free', featured: false,
      features: ['20 Meesho variants per upload', '1200×1200 @ under 100 KB', 'Clean / sticker / shift groups', 'Single-image ZIP export', 'Amazon preset (5 variants)', 'No signup, fully in-browser'],
      missing: ['Bulk generation', 'Watermark studio', 'Custom sizes & PNG'],
    },
    {
      id: 'pro', name: 'Pro', price: '₹499', period: '/month', cta: 'Unlock Pro', featured: true, tag: 'MOST POPULAR',
      features: ['Everything in Free', 'Bulk mode — 10 products at once', 'Watermark studio (corner & tiled)', 'Custom brand colours & borders', 'Any output size up to 3000 px', 'PNG lossless export & quality control', 'Extra badge packs (COD, Free Ship)', 'Extended frame-shift pack', 'Sort-by-size low-shipping finder'],
      missing: [],
    },
    {
      id: 'team', name: 'Team', price: '₹1,499', period: '/month', cta: 'Coming soon', featured: false,
      features: ['Everything in Pro', 'Up to 100 products per batch', 'Shared brand presets', 'Catalog scheduling (roadmap)'],
      missing: ['Currently invite-only'],
    },
  ];
  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 34, letterSpacing: '-0.02em', textAlign: 'center' }}>Simple pricing</h1>
      <p style={{ color: 'var(--muted)', textAlign: 'center', maxWidth: 560, margin: '10px auto 30px' }}>
        The generator core stays free forever. Pro unlocks the premium studio tools that agencies and multi-SKU sellers need.
      </p>
      <div className="plans">
        {plans.map((p) => (
          <div key={p.id} className={`plan ${p.featured ? 'featured' : ''}`}>
            {p.tag && <span className="pill pro tag">{p.tag}</span>}
            <b style={{ fontSize: 17 }}>{p.name}</b>
            <div className="price">{p.price}<small>{p.period}</small></div>
            <ul>
              {p.features.map((f) => <li key={f}>{f}</li>)}
              {p.missing.map((f) => <li key={f} className="no">{f}</li>)}
            </ul>
            <button
              className={`btn ${p.featured ? 'hero' : 'outline'}`}
              disabled={p.id === 'team' || plan === p.id}
              onClick={() => {
                setPlan(p.id);
                toast(p.id === 'pro' ? '✨ Pro unlocked — all premium features enabled!' : 'Switched to Free plan');
              }}
            >
              {plan === p.id ? 'Current plan' : p.cta}
            </button>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 18 }}>
        Demo note: plan switching here is simulated locally (no real payments) so you can try every premium feature.
      </p>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => {
    const h = window.location.hash.replace('#/', '');
    return ROUTES.includes(h) ? h : 'generator';
  });
  const { plan, setPlan } = usePlan();
  const { push: toast, node: toasts } = useToasts();

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#/', '');
      if (ROUTES.includes(h)) setRoute(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r) => {
    setRoute(r);
    window.location.hash = `/${r}`;
    window.scrollTo({ top: 0 });
  };

  const goPro = (feature) => {
    toast(`${feature} is a Pro feature — open Pricing to unlock (demo).`);
    navigate('pricing');
  };

  return (
    <>
      <header className="site">
        <div className="container nav">
          <a className="brand" href="#/generator" onClick={(e) => { e.preventDefault(); navigate('generator'); }}>
            <span className="logo">🛍️</span> Meesho Studio <span className="pro">PRO</span>
          </a>
          <nav className="nav-links">
            <button className={`linkbtn ${route === 'generator' ? 'active' : ''}`} onClick={() => navigate('generator')}>Image Generator</button>
            <button className={`linkbtn hide-sm ${route === 'shipping' ? 'active' : ''}`} onClick={() => navigate('shipping')}>Shipping Guide</button>
            <button className={`linkbtn hide-sm ${route === 'pricing' ? 'active' : ''}`} onClick={() => navigate('pricing')}>Pricing</button>
            <button className="btn hero sm" onClick={() => navigate(plan === 'pro' ? 'pricing' : 'pricing')}>
              {plan === 'pro' ? '⭐ Pro active' : '⬆ Go Pro'}
            </button>
          </nav>
        </div>
      </header>

      <main>
        {route === 'generator' && (
          <>
            <Hero navigate={navigate} />
            <div id="studio">
              <GeneratorPage isPro={plan === 'pro'} goPro={goPro} toast={toast} />
            </div>

            {/* Tool FAQ */}
            <div className="container">
              <div className="section faq">
                <h2>Frequently asked questions</h2>
                {TOOL_FAQ.map((f) => (
                  <details key={f.q}><summary>{f.q}</summary><div className="a">{f.a}</div></details>
                ))}
              </div>

              {/* Cross-sell */}
              <div className="section">
                <h2>More seller tools</h2>
                <div className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                  <div className="step" style={{ textAlign: 'left' }}>
                    <b>📦 Meesho Shipping Charges 2026</b>
                    <small style={{ display: 'block', margin: '6px 0 10px' }}>Full slab × zone rate table, RTO maths and an interactive blended-cost calculator.</small>
                    <button className="btn outline sm" onClick={() => navigate('shipping')}>Read the guide →</button>
                  </div>
                  <div className="step" style={{ textAlign: 'left' }}>
                    <b>💡 Why images affect shipping</b>
                    <small style={{ display: 'block', margin: '6px 0 10px' }}>Splitting variants into separate SKUs lets each ship in its own weight bracket — the generator makes that trivial.</small>
                    <button className="btn outline sm" onClick={() => navigate('shipping')}>Learn more →</button>
                  </div>
                  <div className="step" style={{ textAlign: 'left' }}>
                    <b>⭐ Studio Pro</b>
                    <small style={{ display: 'block', margin: '6px 0 10px' }}>Bulk uploads, watermark studio, brand kits, PNG export and any canvas size.</small>
                    <button className="btn hero sm" onClick={() => navigate('pricing')}>See pricing →</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {route === 'shipping' && <ShippingGuidePage />}
        {route === 'pricing' && <Pricing plan={plan} setPlan={setPlan} toast={toast} />}
      </main>

      <footer className="site">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <b style={{ color: 'var(--fg)' }}>🛍️ Meesho Studio Pro</b>
            <div style={{ marginTop: 4 }}>An independent, premium educational clone of the ListIQ Meesho image-generator tool.</div>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button className="linkbtn btn ghost sm" onClick={() => navigate('generator')}>Generator</button>
            <button className="linkbtn btn ghost sm" onClick={() => navigate('shipping')}>Shipping</button>
            <button className="linkbtn btn ghost sm" onClick={() => navigate('pricing')}>Pricing</button>
          </div>
        </div>
        <div className="container" style={{ marginTop: 16, fontSize: 12 }}>
          Not affiliated with or endorsed by Meesho or ListIQ. All processing happens locally in your browser. © 2026 Meesho Studio Pro.
        </div>
      </footer>

      {toasts}
    </>
  );
}
