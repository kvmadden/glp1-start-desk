import React, { useState } from 'react';
import { ANCHORS, DRUG_COST, DRUG_COST_SOURCE, breakEven } from '../engine/payer.js';

const BUNDLE = [
  'Start visit before the first dose',
  'Check-in a few days after each new strength',
  'Every step request to the prescriber, 3 days before the supply ends',
  'Refill, cost and stock follow-up before a gap opens',
  'Red flags held and sent to the prescriber the same day',
];
const RECORD = [
  'Dose reached and the week it was reached',
  'Days covered since the first fill',
  'Side effects and the decision each time',
  'Every prescriber request, reply and days to reply',
  'Reason for any stop, in the patient\'s words',
  'Pharmacist minutes logged',
];
const NOT = [
  'No prescribing. Every dose change is the prescriber\'s call, unless a collaborative practice agreement says otherwise',
  'No claim of medical savings. Prime found none at 3 years',
  'No outcome promise before the pilot reads out',
];

const money = (x) => `$${Math.round(x).toLocaleString()}`;

// Total cost of care above matched controls, obesity without diabetes, intent to treat.
const OFFSET = [{ y: 'Year 1', v: 7071 }, { y: 'Year 2', v: 4777 }, { y: 'Year 3', v: 4490 }];
const OFFSET_SOURCE = { text: 'Prime Therapeutics, 3-year cost study, Apr 2026. 10,094 members on GLP-1s against 29,570 matched controls', url: 'https://www.primetherapeutics.com/documents/d/primetherapeutics/pt_glp-1-obesity-treatment-3-year-cost-offset-study-with-non-glp1-pb-trends' };

export default function Plans() {
  const [fee, setFee] = useState(65);
  const [months, setMonths] = useState(3);
  const [drug, setDrug] = useState('semaglutide');
  const net = DRUG_COST.find((d) => d.key === drug).netPerYear;
  const b = breakEven({ feePerMonth: fee, months, netPerYear: net });
  return (
    <div className="page plans">
      <section className="planlead">
        <p className="eyebrow">For plans and employers</p>
        <h1>GLP-1s for weight did not pay for themselves in three years. A plan can still <span className="hl">stop paying for doses</span> that never reach a working dose.</h1>
        <div className="offset">
          <p className="sub">Total cost of care above matched members not on a GLP-1, per member per year</p>
          <ol>
            {OFFSET.map((o, i) => (
              <li key={o.y}><span className="oy">{o.y}</span><span className="otrack"><i style={{ width: `${(o.v / 7071) * 100}%`, animationDelay: `${120 + i * 120}ms` }} /></span><span className="mono ov">+{money(o.v)}</span></li>
            ))}
          </ol>
          <p className="sub"><a href={OFFSET_SOURCE.url} target="_blank" rel="noreferrer">{OFFSET_SOURCE.text}</a>. Medical spend was not lower, even in adherent members.</p>
        </div>
        <p className="lede">So the honest pitch is not savings. It is that more of the plan's drug dollars reach a working dose, with a monthly record that proves it. Pharmacist support is free at the counter today. This is the version a plan pays for.</p>
      </section>

      <div className="pcards three">
        <article className="mcard">
          <h3>What the plan buys</h3>
          <ul className="plist">{BUNDLE.map((l) => <li key={l}>{l}</li>)}</ul>
          <p className="sub">Priced per enrolled member per month. Employers can convert to per employee per month at their own enrollment.</p>
        </article>
        <article className="mcard">
          <h3>What it gets every month</h3>
          <ul className="plist">{RECORD.map((l) => <li key={l}>{l}</li>)}</ul>
        </article>
        <article className="mcard">
          <h3>What it does not get</h3>
          <ul className="plist">{NOT.map((l) => <li key={l}>{l}</li>)}</ul>
        </article>
      </div>

      <section className="calc mcard" aria-label="What must be true">
        <h2>What must be true for the fee to pay back</h2>
        <p className="sub">Arithmetic on public numbers, not a forecast. Change any input.</p>
        <div className="calcgrid">
          <label>Fee per member per month
            <span className="inrow"><input type="range" min="25" max="140" step="5" value={fee} onChange={(e) => setFee(+e.target.value)} /><b className="mono">{money(fee)}</b></span>
          </label>
          <label>Months billed
            <span className="inrow"><input type="range" min="1" max="12" step="1" value={months} onChange={(e) => setMonths(+e.target.value)} /><b className="mono">{months}</b></span>
          </label>
          <div className="seg" role="radiogroup" aria-label="Drug">
            {DRUG_COST.map((d) => <button key={d.key} role="radio" aria-checked={drug === d.key} className={drug === d.key ? 'segbtn on' : 'segbtn'} onClick={() => setDrug(d.key)}>{d.label} {money(d.netPerYear)} a year net</button>)}
          </div>
        </div>
        <div className="calcout">
          <div><span className="big mono">{money(b.program)}</span><span className="sub">program cost per member</span></div>
          <div><span className="big mono">{(100 * b.shareOfDrug).toFixed(0)}%</span><span className="sub">of net drug spend over the same months</span></div>
          <div className="hotout"><span className="big mono">{b.drugMonthsEquivalent.toFixed(2)}</span><span className="sub">drug-months the program must keep from being wasted, per member, to pay for itself</span></div>
        </div>
        <p className="sub">Wasted means drug paid for in someone who stops before a maintenance dose. Keeping people on therapy raises drug spend, so the case is a higher share of drug dollars reaching a working dose, not lower total cost. Net cost: <a href={DRUG_COST_SOURCE.url} target="_blank" rel="noreferrer">{DRUG_COST_SOURCE.source}</a>.</p>
      </section>

      <section className="anchors">
        <h2>What buyers pay for this today</h2>
        <ul>
          {ANCHORS.map((x) => (
            <li key={x.key}>
              <span className="big mono">{x.value}</span>
              <span className="sub">{x.unit}</span>
              <span>{x.text}. <a href={x.url} target="_blank" rel="noreferrer">{x.source}</a></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
