// The opening story: why people stop, when each break hits, and who sees it first.
import React, { useState } from 'react';
import { REASONS, REASONS_SOURCE, SEES, SEES_NOTE, WHO } from './content.js';
import { useNarrow } from './bits.jsx';
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

// Chart 2: each patient's next break by the day it hits.
function BreakStrip({ data, go }) {
  const narrow = useNarrow();
  const [hover, setHover] = useState(null);
  const pts = breakPoints(data);
  const W = narrow ? 358 : 1180;
  const laneH = narrow ? 58 : 52;
  const L = narrow ? 0 : 320;
  const R = narrow ? 24 : 48;
  const T = 30;
  const H = T + BREAK_LANES.length * laneH + 8;
  const x = (d) => L + 12 + (Math.min(d, 14) / 14) * (W - L - R - 24);
  const yOf = (i) => T + i * laneH + laneH / 2 + (narrow ? 10 : 0);
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
        {BREAK_LANES.map((ln, i) => {
          const seen = {};
          return pts.filter((q) => q.b.key === ln.key).sort((m, n) => m.b.day - n.b.day).map((q) => {
            const stack = (seen[q.b.day] = (seen[q.b.day] || 0) + 1) - 1;
            const cx = x(q.b.day) + stack * (narrow ? 10 : 15);
            return (
              <g key={q.p.id} className={`a-dot ${ln.kind}`} onMouseEnter={() => setHover({ q, cx, cy: yOf(i) })} onMouseLeave={() => setHover(null)} onClick={() => go('desk', q.p.id)}>
                <circle cx={cx} cy={yOf(i)} r={narrow ? 6 : 7} />
                <circle cx={cx} cy={yOf(i)} r={narrow ? 22 : 38} className="hit" />
              </g>
            );
          });
        })}
        {hover && !narrow && (
          <g className="a-tip" transform={`translate(${Math.min(hover.cx + 14, W - 300)}, ${hover.cy - 42})`}>
            <rect width="286" height="30" />
            <text x="12" y="20">{firstName(hover.q.p.name)}: {hover.q.p.analysis.action.title.toLowerCase()}</text>
          </g>
        )}
      </svg>
      <p className="a-note">Each dot is read from the prescription file, the approval, the card, the shelf or the last check-in. {narrow ? 'Tap' : 'Click'} a dot to open the patient.</p>
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
      <p className="a-note"><Harvey s="yes" /> sees it in the normal course of work <Harvey s="maybe" /> only sometimes <Harvey s="no" /> does not see it. Kevin's read of who holds the information today, from more than 15 years in pharmacy, not a measured result.</p>
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
        <h2>Only the pharmacy sees <em>all of them</em>.</h2>
        <p className="a-stand narrow">The prescriber and the plan each hold part of the picture. The counter holds the whole thing, days before the patient gives up.</p>
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
