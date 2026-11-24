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
