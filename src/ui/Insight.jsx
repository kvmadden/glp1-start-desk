import React, { useState } from 'react';
import { BREAKS, breakOf } from '../engine/desk.js';
import { useNarrow } from './bits.jsx';
import { dateLabel, firstName } from './format.js';

// Reasons for stopping, from one clinic's chart review of semaglutide and tirzepatide stops.
export const REASONS = [
  { label: 'Money: denial, coupon ended, cost', pct: 47.6, kind: 'money' },
  { label: 'Shortage', pct: 11.8, kind: 'supply' },
  { label: 'Side effects', pct: 14.6, kind: 'clinical' },
  { label: 'Unknown', pct: 11.1, kind: 'quiet' },
  { label: 'Other', pct: 10.8, kind: 'quiet' },
];
export const REASONS_SOURCE = { text: 'Money and shortage together: 59.4%. Gasoyan et al., Obesity, 2026, a chart review of 288 people who stopped at one health system, via Cleveland Clinic', url: 'https://consultqd.clevelandclinic.org/cost-side-effects-top-reasons-for-quitting-glp-1s-for-obesity' };

// Who can see each break before the patient stops. Kevin's read of how the information flows today.
export const SEES = {
  rx: ['maybe', 'no', 'yes'],
  pa: ['maybe', 'yes', 'yes'],
  cost: ['no', 'no', 'yes'],
  stock: ['no', 'no', 'yes'],
  effects: ['maybe', 'no', 'yes'],
};
export const SEES_NOTE = {
  rx: ['Only if they track the schedule', '', 'The file has no Rx for the next strength'],
  pa: ['After a denial notice', 'It issued the approval', 'The claim rejects at the counter'],
  cost: ['', 'A manufacturer card is outside the plan', 'The card adjudicates at the register'],
  stock: ['', '', 'The shelf and the order'],
  effects: ['If the patient calls', '', 'At every step-up pickup'],
};
export const WHO = ['Prescriber', 'Plan or PBM', 'Pharmacy'];

function Reasons() {
  return (
    <ol className="reasons">
      {REASONS.map((r, i) => (
        <li key={r.label} className={r.kind}>
          <span className="rlabel">{r.label}</span>
          <span className="rtrack"><i style={{ width: `${(r.pct / 50) * 100}%`, animationDelay: `${150 + i * 90}ms` }} /></span>
          <span className="rpct mono">{r.pct}%</span>
        </li>
      ))}
    </ol>
  );
}

function BreakChart({ data, go }) {
  const narrow = useNarrow();
  const [hover, setHover] = useState(null);
  const lanes = BREAKS;
  const pts = data.order.map((id) => data.patients[id]).map((p) => ({ p, b: breakOf(p.analysis, 0) })).filter((x) => x.b);
  const W = narrow ? 360 : 1100;
  const laneH = narrow ? 54 : 56;
  const L = narrow ? 8 : 300;
  const R = narrow ? 12 : 56;
  const T = narrow ? 8 : 12;
  const H = T + lanes.length * laneH + 34;
  const days = 14;
  const x = (d) => L + 14 + (Math.min(d, days) / days) * (W - L - R - 28);
  const yOf = (i) => T + i * laneH + laneH / 2 + (narrow ? 8 : 0);
  return (
    <figure className="breakfig">
      <svg viewBox={`0 0 ${W} ${H}`} className="breaks" role="img" aria-label="Each patient's next break, by the day it hits, over the next 14 days">
        {[0, 7, 14].map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={T} y2={T + lanes.length * laneH} className="bgrid" />
            <text x={x(d)} y={H - 10} className="baxis" textAnchor={d === 14 ? 'end' : d === 0 ? 'start' : 'middle'}>{d === 0 ? 'Today' : `${dateLabel(d)}`}</text>
          </g>
        ))}
        {lanes.map((ln, i) => {
          const n = pts.filter((q) => q.b.key === ln.key).length;
          return (
            <g key={ln.key}>
              <line x1={narrow ? 0 : L} x2={W - R + 8} y1={yOf(i)} y2={yOf(i)} className="blane" />
              {narrow
                ? <text x={0} y={yOf(i) - 14} className="blabel">{ln.label}</text>
                : <text x={L - 20} y={yOf(i) + 5} className="blabel" textAnchor="end">{ln.label}</text>}
              <text x={W - 4} y={yOf(i) + 5} className="bcount mono" textAnchor="end">{n}</text>
            </g>
          );
        })}
        {lanes.map((ln, i) => {
          const here = pts.filter((q) => q.b.key === ln.key).sort((a, b) => a.b.day - b.b.day);
          const seen = {};
          return here.map((q, k) => {
            const stack = (seen[q.b.day] = (seen[q.b.day] || 0) + 1) - 1;
            const cx = x(q.b.day) + stack * (narrow ? 9 : 14);
            return (
              <g key={q.p.id} className={`bdot ${ln.kind}`} style={{ animationDelay: `${300 + i * 80 + k * 40}ms` }}
                onMouseEnter={() => setHover({ q, cx, cy: yOf(i) })} onMouseLeave={() => setHover(null)} onClick={() => go('desk', q.p.id)}>
                <circle cx={cx} cy={yOf(i)} r={narrow ? 6 : 8} />
                <circle cx={cx} cy={yOf(i)} r={22} className="hit" />
              </g>
            );
          });
        })}
        {hover && !narrow && (
          <g className="btip" transform={`translate(${Math.min(hover.cx + 14, W - 250)}, ${hover.cy - 40})`}>
            <rect width="236" height="30" rx="8" />
            <text x="12" y="20">{firstName(hover.q.p.name)}: {hover.q.p.analysis.action.title.toLowerCase()}</text>
          </g>
        )}
      </svg>
      <figcaption className="sub">32 synthetic patients, weighted toward the reasons above. Each dot is the day that patient's break hits, read from the prescription file, the approval, the card, the shelf or the last check-in. {narrow ? 'Tap' : 'Click'} a dot to open the patient.</figcaption>
    </figure>
  );
}

function WhoSees() {
  const mark = { yes: '●', maybe: '◐', no: '○' };
  return (
    <div className="whosees" role="table" aria-label="Who sees each break before the patient stops">
      <div className="wrow whead" role="row">
        <span role="columnheader" />
        {WHO.map((w) => <span key={w} role="columnheader" className={w === 'Pharmacy' ? 'wcol hot' : 'wcol'}>{w}</span>)}
      </div>
      {BREAKS.filter((b) => SEES[b.key]).map((b) => (
        <div className="wrow" role="row" key={b.key}>
          <span role="rowheader" className="wlabel">{b.label}</span>
          {SEES[b.key].map((s, i) => (
            <span role="cell" key={i} className={`wcell ${s}${i === 2 ? ' hot' : ''}`}>
              <b aria-label={s === 'yes' ? 'Sees it' : s === 'maybe' ? 'Sometimes' : 'Does not see it'}>{mark[s]}</b>
              <small>{SEES_NOTE[b.key][i]}</small>
            </span>
          ))}
        </div>
      ))}
      <p className="sub wkey"><b>●</b> sees it in the normal course of work <b>◐</b> only sometimes <b>○</b> does not see it. This is Kevin's read of who holds the information today, from more than 15 years in pharmacy, not a measured result.</p>
    </div>
  );
}

export default function Insight({ data, go }) {
  return (
    <div className="insight">
      <section className="chapter">
        <p className="eyebrow">GLP-1 Start Desk</p>
        <h1>Most GLP-1 stops are about <span className="hl">money and supply</span>, not side effects.</h1>
        <Reasons />
        <p className="sub src"><a href={REASONS_SOURCE.url} target="_blank" rel="noreferrer">{REASONS_SOURCE.text}</a></p>
      </section>
      <section className="chapter">
        <h2 className="ch">Each of those breaks has a date the pharmacy can see coming.</h2>
        <p className="chsub">Every step up is a new strength, a new prescription, often a new approval. The supply runs out on a known day.</p>
        <BreakChart data={data} go={go} />
      </section>
      <section className="chapter">
        <h2 className="ch">Only the pharmacy sees <span className="hl">all of them</span>.</h2>
        <p className="chsub">The prescriber and the plan each hold part of the picture. The counter holds the whole thing, days before the patient gives up.</p>
        <WhoSees />
      </section>
      <section className="chapter end">
        <h2 className="ch">So the desk turns each break into one action, dated before it hits.</h2>
        <div className="ctas">
          <button className="primary big" onClick={() => go('desk')}>Open today's work list</button>
          <button className="ghost" onClick={() => go('plans')}>What a plan would pay for</button>
        </div>
      </section>
    </div>
  );
}
