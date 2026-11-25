// The opening story: why people stop, when each break hits, and who sees it first.
import React, { useState } from 'react';
import { REASONS, REASONS_SOURCE, SEES, SEES_NOTE, WHO } from './content.js';
import { useNarrow, useFinePointer } from './bits.jsx';
import { dateLabel, firstName } from './format.js';
import { breakPoints, BREAK_LANES } from './deskState.js';

// Chart 1: why people stop, annotated in place.
function ReasonsChart() {
  const narrow = useNarrow();
  const W = narrow ? 358 : 640;
  const L = 0;
  const R = narrow ? 56 : 160;
  const rowH = narrow ? 50 : 58;
  const T = 34;
  const H = T + REASONS.length * rowH + 4;
  const x = (v) => L + (v / 50) * (W - L - R);
  const tone = { money: 'money', supply: 'supply', clinical: 'clinical', quiet: 'quiet' };
  return (
    <figure className="a-fig">
      <figcaption className="a-figtitle">Why people stopped, share of 288 stops</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="a-reasons" role="img" aria-label="Reasons for stopping: money 47.6%, shortage 11.8%, side effects 14.6%, unknown 11.1%, other 10.8%">
        {[0, 10, 20, 30, 40, 50].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={T - 8} y2={H} className="a-grid" />
            <text x={x(t)} y={T - 16} className="a-tick" textAnchor={t === 0 ? 'start' : 'middle'}>{t}{t === 50 ? '%' : ''}</text>
          </g>
        ))}
        {REASONS.map((r, i) => {
          const y = T + i * rowH;
          return (
            <g key={r.label} className={`a-bar ${tone[r.kind]}`}>
              <text x={L} y={y + 16} className="a-blabel">{r.label}</text>
              <rect x={L} y={y + 24} width={x(r.pct) - L} height={narrow ? 16 : 20} />
              <text x={x(r.pct) + 8} y={y + 24 + (narrow ? 13 : 15)} className="a-bval">{r.pct}%</text>
            </g>
          );
        })}
        {!narrow && (
          <g className="a-brace">
            <path d={`M ${W - 92} ${T + 24} h 10 v ${rowH + 20} h -10 M ${W - 82} ${T + 24 + (rowH + 20) / 2} h 8`} />
            <text x={W - 66} y={T + 24 + (rowH + 20) / 2 - 4}>59.4%</text>
            <text x={W - 66} y={T + 24 + (rowH + 20) / 2 + 14} className="small">together</text>
          </g>
        )}
      </svg>
    </figure>
  );
}

// Same-day dots stack as a small beeswarm: up to three to a column on desktop, three down on a phone,
// so no two dots share a spot. Each dot's click area starts as a 44-unit square inside its lane,
// then any two that overlap are split at their midpoint, so no click area covers another dot's.
function layoutDots(pts, x, yOf, laneH, narrow) {
  const step = narrow ? 13 : 16;
  const rows = narrow ? [0, 1, 2] : [0, -1, 1];
  const half = narrow ? 22 : 28;
  const out = [];
  BREAK_LANES.forEach((ln, i) => {
    const seen = {};
    const top = narrow ? yOf(i) - 12 : yOf(i) - laneH / 2;
    const bottom = narrow ? yOf(i) + 38 : yOf(i) + laneH / 2;
    const here = pts.filter((q) => q.b.key === ln.key).sort((m, n) => m.b.day - n.b.day);
    const dots = here.map((q) => {
      const d = Math.min(q.b.day, 14);
      const k = (seen[d] = (seen[d] || 0) + 1) - 1;
      const cx = x(d) + Math.floor(k / rows.length) * step;
      const cy = yOf(i) + rows[k % rows.length] * step;
      return { q, ln, cx, cy, hit: { x0: cx - half, x1: cx + half, y0: Math.max(top, cy - half), y1: Math.min(bottom, cy + half) } };
    });
    for (let a = 0; a < dots.length; a += 1) {
      for (let b = a + 1; b < dots.length; b += 1) {
        const A = dots[a].hit;
        const B = dots[b].hit;
        if (A.x0 >= B.x1 || B.x0 >= A.x1 || A.y0 >= B.y1 || B.y0 >= A.y1) continue;
        const dx = dots[b].cx - dots[a].cx;
        const dy = dots[b].cy - dots[a].cy;
        if (Math.abs(dx) >= Math.abs(dy)) {
          const m = (dots[a].cx + dots[b].cx) / 2;
          if (dx >= 0) { A.x1 = Math.min(A.x1, m); B.x0 = Math.max(B.x0, m); } else { A.x0 = Math.max(A.x0, m); B.x1 = Math.min(B.x1, m); }
        } else {
          const m = (dots[a].cy + dots[b].cy) / 2;
          if (dy >= 0) { A.y1 = Math.min(A.y1, m); B.y0 = Math.max(B.y0, m); } else { A.y0 = Math.max(A.y0, m); B.y1 = Math.min(B.y1, m); }
        }
      }
    }
    out.push(...dots);
  });
  return out;
}

// Chart 2: each patient's next break by the day it hits.
function BreakStrip({ data, go }) {
  const narrow = useNarrow();
  // Dots open a patient only with a mouse. On touch screens they sit too close for a 44px tap
  // target each, so the chart is read-only there and every patient is one tap away in the work list.
  const fine = useFinePointer() && !narrow;
  const [hover, setHover] = useState(null);
  const pts = breakPoints(data);
  const W = narrow ? 358 : 1180;
  const laneH = narrow ? 66 : 52;
  const L = narrow ? 0 : 320;
  const R = narrow ? 24 : 48;
  const T = 30;
  const H = T + BREAK_LANES.length * laneH + 8;
  const x = (d) => L + 12 + (Math.min(d, 14) / 14) * (W - L - R - 24);
  const yOf = (i) => T + i * laneH + laneH / 2 + (narrow ? 10 : 0);
  const placed = layoutDots(pts, x, yOf, laneH, narrow);
  return (
    <figure className="a-fig wide">
      <figcaption className="a-figtitle">The next break for each of 32 synthetic patients, by the day it hits</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="a-strip" role="img" aria-label="Each patient's next break over the next 14 days">
        {[0, 7, 14].map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={T - 6} y2={H} className="a-grid" />
            <text x={x(d)} y={T - 14} className="a-tick" textAnchor={d === 14 ? 'end' : d === 0 ? 'start' : 'middle'}>{d === 0 ? 'Today' : dateLabel(d)}</text>
          </g>
        ))}
        {BREAK_LANES.map((ln, i) => {
          const n = pts.filter((q) => q.b.key === ln.key).length;
          return (
            <g key={ln.key}>
              <line x1={narrow ? 0 : L} x2={W - R + 12} y1={yOf(i)} y2={yOf(i)} className="a-lane" />
              {narrow ? <text x={0} y={yOf(i) - 16} className="a-lanel">{ln.label}</text> : <text x={L - 24} y={yOf(i) + 5} className="a-lanel" textAnchor="end">{ln.label}</text>}
              <text x={W} y={yOf(i) + 5} className="a-count" textAnchor="end">{n}</text>
            </g>
          );
        })}
        {placed.map(({ q, ln, cx, cy, hit }) => (fine ? (
          <g key={q.p.id} className={`a-dot ${ln.kind}`} onMouseEnter={() => setHover({ q, cx, cy })} onMouseLeave={() => setHover(null)} onClick={() => go('desk', q.p.id)}>
            <rect x={hit.x0} y={hit.y0} width={hit.x1 - hit.x0} height={hit.y1 - hit.y0} className="hit" />
            <circle cx={cx} cy={cy} r={narrow ? 6 : 7} />
          </g>
        ) : (
          <circle key={q.p.id} className={`a-dot still ${ln.kind}`} cx={cx} cy={cy} r={narrow ? 6 : 7} />
        )))}
        {hover && fine && (
          <g className="a-tip" transform={`translate(${Math.min(hover.cx + 14, W - 300)}, ${hover.cy - 42})`}>
            <rect width="286" height="30" />
            <text x="12" y="20">{firstName(hover.q.p.name)}: {hover.q.p.analysis.action.title.toLowerCase()}</text>
          </g>
        )}
      </svg>
      <p className="a-note">Each dot is read from the prescription file, the approval, the card, the shelf or the last check-in. {fine ? 'Click a dot to open the patient.' : 'Every patient is in the work list.'}</p>
      {!fine && <button className="a-link a-open" onClick={() => go('desk')}>Open the work list →</button>}
    </figure>
  );
}

function Harvey({ s }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={`a-hv ${s}`} aria-label={s === 'yes' ? 'Sees it' : s === 'maybe' ? 'Sometimes' : 'Does not see it'}>
      <circle cx="8" cy="8" r="6.5" />
      {s === 'maybe' && <path d="M8 1.5 A6.5 6.5 0 0 1 8 14.5 Z" />}
    </svg>
  );
}

function WhoSees() {
  return (
    <div className="a-table" role="table" aria-label="Who sees each break before the patient stops">
      <div className="a-tr a-th" role="row">
        <span role="columnheader">Break</span>
        {WHO.map((w) => <span key={w} role="columnheader" className={w === 'Pharmacy' ? 'hot' : ''}>{w}</span>)}
      </div>
      {BREAK_LANES.filter((b) => SEES[b.key]).map((b) => (
        <div className="a-tr" role="row" key={b.key}>
          <span role="rowheader" className="a-rh">{b.label}</span>
          {SEES[b.key].map((s, i) => (
            <span role="cell" key={i} className={i === 2 ? 'hot' : ''}>
              <Harvey s={s} />
              {SEES_NOTE[b.key][i] && <small>{SEES_NOTE[b.key][i]}</small>}
            </span>
          ))}
        </div>
      ))}
      <p className="a-note a-key"><span><Harvey s="yes" /> sees it in the normal course of work</span> <span><Harvey s="maybe" /> only sometimes</span> <span><Harvey s="no" /> does not see it.</span> Kevin's read of who holds the information today, from more than 15 years in pharmacy, not a measured result.</p>
    </div>
  );
}

export default function Insight({ data, go }) {
  return (
    <div className="a-insight">
      <section className="a-lead">
        <div className="a-leadtext">
          <p className="a-kicker">Why GLP-1 starts fail</p>
          <h1>Most GLP-1 stops are about <em>money and supply</em>, not side effects.</h1>
          <p className="a-stand">In one health system's review of 288 people who stopped, denials, ended coupons, cost and shortages explain 59.4% of stops. Side effects explain 14.6%.</p>
          <p className="a-source">Source: <a href={REASONS_SOURCE.url} target="_blank" rel="noreferrer">Gasoyan et al., Obesity, 2026, via Cleveland Clinic</a></p>
        </div>
        <ReasonsChart />
      </section>
      <section className="a-chapter">
        <p className="a-num">2</p>
        <h2>Each of those breaks has a date the pharmacy can see coming.</h2>
        <p className="a-stand narrow">Every step up is a new strength, a new prescription, often a new approval. The supply runs out on a known day.</p>
        <BreakStrip data={data} go={go} />
      </section>
      <section className="a-chapter">
        <p className="a-num">3</p>
        <h2>The pharmacy sees <em>all of them</em> in one place.</h2>
        <p className="a-stand narrow">The prescriber and the plan each see part of the picture. The counter sees the whole thing, often days before the patient gives up.</p>
        <WhoSees />
      </section>
      <section className="a-chapter a-close">
        <h2>So the desk turns each break into one action, dated before it hits.</h2>
        <div className="a-ctas">
          <button className="a-btn" onClick={() => go('desk')}>Open today's work list</button>
          <button className="a-link" onClick={() => go('plans')}>What a plan would pay for →</button>
        </div>
      </section>
    </div>
  );
}
