import React from 'react';
import { WHY_STOP } from '../engine/payer.js';

// Where new starts fall off in the first 12 weeks, and the desk rule that catches each one.
const CLIFFS = [
  { weeks: 'Week 1', title: 'First dose', what: 'Nausea starts and people decide whether this is for them.', rule: 'First-week check-in', types: ['checkin'] },
  { weeks: 'Week 4', title: 'The first box runs out', what: 'The next strength is a new prescription. The prior authorization may name only the starting strength. The savings card may end.', rule: 'Step fax 3 days early, prior authorization fax, cost call', types: ['step', 'pa', 'cost', 'bridge'], hot: true },
  { weeks: 'Weeks 5 to 6', title: 'Stomach effects after the step', what: 'The new dose hits. Moderate nausea or vomiting is when people quietly stop.', rule: 'Check-in after each step, slow-down request, hold on red flags', types: ['slow', 'lower', 'hold', 'other-drug'], hot: true },
  { weeks: 'Week 8', title: 'Second step, same paperwork', what: 'Another new strength, another prescription, and the store may not stock it.', rule: 'Step fax and a stock order before the supply ends', types: ['stock'], hot: true },
  { weeks: 'Any week', title: 'Two weeks without supply', what: 'Wegovy says to restart lower after 2 or more missed doses. The other labels leave it to the prescriber.', rule: 'Restart fax the same day', types: ['restart', 'refill'] },
];

// The Wegovy ladder from the label, weeks 0 to 16, with each step-up marked as a place to fall off.
function Staircase() {
  const W = 1200; const H = 220; const L = 40; const R = 20; const T = 30; const B = 40;
  const steps = [0.25, 0.5, 1, 1.7, 2.4];
  const x = (w) => L + (w / 21) * (W - L - R);
  const y = (i) => T + (H - T - B) * (1 - (i + 1) / steps.length);
  let d = `M ${x(0)} ${y(0)}`;
  steps.forEach((_, i) => { const w1 = Math.min(21, i === steps.length - 1 ? 21 : (i + 1) * 4); d += ` H ${x(w1)}`; if (i < steps.length - 1) d += ` V ${y(i + 1)}`; });
  return (
    <svg className="stepsvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wegovy label dose steps every 4 weeks, with each step-up marked">
      {[4, 8, 12, 16].map((w) => <rect key={w} className="cl" x={x(w) - 26} y={T - 18} width="52" height={H - T - B + 18} rx="10" />)}
      {[4, 8, 12, 16].map((w) => <text key={'c' + w} className="clt" x={x(w)} y={T - 4} textAnchor="middle">new Rx</text>)}
      <path d={d} />
      {steps.map((s, i) => <text key={s} x={x(i === steps.length - 1 ? 18.5 : i * 4 + 2)} y={y(i) - 10} textAnchor="middle">{s === 2.4 ? '2.4 mg maintenance' : `${s} mg`}</text>)}
      {[0, 4, 8, 12, 16].map((w) => <text key={'w' + w} x={x(w)} y={H - 12} textAnchor="middle">{w === 0 ? 'Start' : `Week ${w}`}</text>)}
    </svg>
  );
}

export default function WhyStop({ data, go }) {
  const all = data.order.map((id) => data.patients[id]);
  const count = (types) => all.filter((p) => types.includes(p.analysis.action.type || p.analysis.action.kind)).length;
  return (
    <div className="page whypage">
      <section className="hero small">
        <p className="eyebrow">Why people stop</p>
        <h1>Most new starts never reach week 12. Every <span className="hl">step up</span> is a place to fall off.</h1>
        <p className="lede">Each step up is a new strength, a new prescription, often a new approval and a new round of nausea. The desk puts a rule on each of those moments.</p>
      </section>
      <Staircase />
      <ol className="cliffs">
        {CLIFFS.map((c) => (
          <li key={c.weeks} className={c.hot ? 'cliff hot' : 'cliff'}>
            <span className="mono">{c.weeks}</span>
            <h3>{c.title}</h3>
            <p>{c.what}</p>
            <p className="rule"><b>Desk:</b> {c.rule}</p>
            <button className="link" onClick={() => go('today')}>{count(c.types)} on today's desk</button>
          </li>
        ))}
      </ol>
      <section className="evidence">
        <h2>What the public evidence says</h2>
        <ul>
          {WHY_STOP.map((w) => (
            <li key={w.value}>
              <span className="big mono">{w.value}</span>
              <span>{w.text}. <a href={w.url} target="_blank" rel="noreferrer">{w.source}</a></span>
            </li>
          ))}
        </ul>
        <p className="sub">These are other people's studies, quoted for context. The desk itself makes no outcome claim. The pilot is how it would earn one.</p>
      </section>
    </div>
  );
}
