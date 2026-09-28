import React, { useMemo, useState } from 'react';
import {
  SHIPPING_RATES, SHIPPING_ZONES, GST_RATE, forwardShipping, rtoCost,
} from './lib/engine.js';

const WEIGHTS = [500, 1000, 1500, 2000, 2500, 3000];

const FAQ = [
  { q: 'How are Meesho shipping charges calculated in 2026?', a: 'Forward shipping is a base charge for the first 500 g plus a per-500 g add-on, and both depend on the delivery zone. Local is ₹50 + ₹18 per additional 500 g, Zonal ₹60 + ₹20, and National ₹75 + ₹25. GST at 18% is charged on top.' },
  { q: 'Which weight does Meesho charge me on — actual or volumetric?', a: 'The higher of the two. Volumetric weight is length × breadth × height in centimetres divided by 5,000. A light but bulky parcel is billed as though it were heavy, which is why packaging size matters as much as product weight.' },
  { q: 'How much does an RTO cost on Meesho?', a: 'A return to origin is charged at roughly 50% of the forward shipping fee for the same parcel and zone — and you earn no revenue on that order.' },
  { q: 'How can I reduce my Meesho shipping charges?', a: 'Keep each parcel inside the lightest slab that fits it, switch bulky boxes to poly-mailers or vacuum-sealed packs, list every colour and size as its own SKU, and attack returns — RTO is the single largest hidden shipping cost for fashion sellers.' },
  { q: 'Does crossing 500 g really matter?', a: 'Yes — a parcel at 501 g is billed in the second slab. On a national order that jumps from ₹75 to ₹100 before GST. Removing a heavy insert or thinner packaging often brings a parcel back under the line.' },
];

export default function ShippingGuidePage() {
  const [weight, setWeight] = useState(500);
  const [zone, setZone] = useState('national');
  const [returnRate, setReturnRate] = useState(25);

  const calc = useMemo(() => {
    const fwd = forwardShipping(weight, zone);
    const gst = Math.round(fwd * GST_RATE);
    const rto = rtoCost(weight, zone);
    const orders = 100;
    const returned = Math.round((orders * returnRate) / 100);
    const delivered = orders - returned;
    const totalCost = delivered * (fwd + gst) + returned * (fwd + gst + rto);
    return { fwd, gst, rto, costDelivered: fwd + gst, blendedPerOrder: Math.round(totalCost / delivered), totalCost };
  }, [weight, zone, returnRate]);

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 34, letterSpacing: '-0.02em' }}>Meesho Shipping Charges 2026</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 720, marginTop: 10 }}>
        Forward shipping is billed by weight slab and delivery zone, 18% GST applies on the fee, and about half the
        forward rate comes back as an RTO charge. Here is the full table, a live worked example, and the four levers
        that actually reduce what you pay per order.
      </p>

      {/* Rate table */}
      <div className="section">
        <h2>Forward shipping rate table</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="rates">
            <thead>
              <tr><th>Parcel weight</th>{SHIPPING_ZONES.map((z) => <th key={z.id}>{z.label}</th>)}</tr>
            </thead>
            <tbody>
              {WEIGHTS.map((w) => (
                <tr key={w}>
                  <td><b>{w < 1000 ? `Up to ${w} g` : `Up to ${(w / 1000).toFixed(1)} kg`}</b></td>
                  {SHIPPING_ZONES.map((z) => <td key={z.id}>₹{forwardShipping(w, z.id)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          Base charge covers the first 500 g; each further 500 g adds the per-slab amount. Rates follow the public
          Meesho Supplier Panel schedule for January 2026 — confirm your live rates in your panel.
        </p>
      </div>

      {/* Interactive calculator */}
      <div className="section">
        <h2>Interactive shipping &amp; RTO calculator</h2>
        <div className="workspace" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="head"><h3>Your order</h3></div>
            <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label={`Parcel weight — ${weight} g`}>
                <input type="range" min={250} max={3000} step={50} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </Field>
              <Field label="Delivery zone">
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  {SHIPPING_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label} — {z.meaning}</option>)}
                </select>
              </Field>
              <Field label={`Return (RTO) rate — ${returnRate}%`}>
                <input type="range" min={0} max={60} step={5} value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))} />
              </Field>
            </div>
          </div>
          <div className="card">
            <div className="head"><h3>Cost breakdown</h3></div>
            <div className="body">
              {[
                [`Forward shipping (${weight} g, ${zone})`, `₹${calc.fwd}`],
                ['GST on shipping (18%)', `₹${calc.gst}`],
                ['Cost on a delivered order', `₹${calc.costDelivered}`],
                ['If it comes back as an RTO, add', `₹${calc.rto}`],
                ['Blended cost per delivered order', `₹${calc.blendedPerOrder}`],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontWeight: i >= 3 ? 700 : 400 }}>
                  <span style={{ color: 'var(--muted)' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="callout" style={{ marginTop: 14 }}>
                At a {returnRate}% return rate you pay the RTO charge on {Math.round(returnRate / 25)} order in {returnRate > 0 ? Math.max(1, Math.round(100 / returnRate)) : '—'} while earning revenue only on delivered ones — which is why blended cost, not per-order cost, is the number to price against.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Four ways */}
      <div className="section">
        <h2>Four ways to reduce Meesho shipping charges</h2>
        <div className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>
          {[
            ['1 · Stay inside the lightest slab', 'The jump from 500 g to 501 g costs a full extra slab. Weigh finished parcels, not products — hunt thick corrugate, stiffeners and freebies.'],
            ['2 · Cut volumetric weight', 'L × B × H ÷ 5000. Apparel in a rigid box bills above real weight; the same garment in a poly-mailer often drops a whole slab.'],
            ['3 · Split variants into SKUs', 'One listing with five sizes ships at the heaviest bracket. Separately listed, each size gets its own bracket — and its own optimized images.'],
            ['4 · Attack returns first', 'Accurate size charts, real product-only photos on white backgrounds and honest fabric descriptions cut returns more reliably than any packaging change.'],
          ].map(([t, d]) => (
            <div key={t} className="step" style={{ textAlign: 'left' }}><b style={{ marginBottom: 6 }}>{t}</b><small style={{ lineHeight: 1.5 }}>{d}</small></div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="section faq">
        <h2>Frequently asked questions</h2>
        {FAQ.map((f) => (
          <details key={f.q}><summary>{f.q}</summary><div className="a">{f.a}</div></details>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
