import React from 'react';

// How a plan would prove the desk works. No outcome claim is made before a pilot.
const CARDS = [
  {
    title: 'Logged on every patient',
    lines: ['Each action the desk proposed and whether it happened, by when', 'Prescriber reply and days to reply', 'Side effects and the decision', 'Reason for any stop', 'Pharmacist minutes, and whether the store was short-staffed that day'],
  },
  {
    title: 'What it answers',
    lines: [
      'Main: share of new starts with supply covering week 12, from claims, by arm',
      'Share who reach week 12 with no unplanned restart',
      'Days from step due to the next strength on file',
      'Stops for side effects, and red flags sent the same day',
      'Drug dollars spent on people who stopped before a maintenance dose',
    ],
  },
  {
    title: 'Stop rules, set in advance',
    lines: [
      'Safety: any red flag without same-day prescriber contact pauses enrollment for a clinical review',
      'Burden: stop adding stores if desk stores miss their must-today actions on short-staffed days two weeks running',
      'Prescribers: stop if a set share of prescribers ask to stop the faxes',
      'Futility: an independent statistician checks at the halfway point and stops if the margin is out of reach',
    ],
  },
  {
    title: 'Decision',
    lines: [
      'Sell it if the desk arm beats usual care by the margin set in advance',
      'If not, the action log shows whether the rules, the timing or the staffing fell short',
      'Enroll for 8 weeks, read out once the last patient passes week 12 and claims settle',
    ],
  },
];

export default function Pilot() {
  return (
    <div className="page pilot">
      <section className="hero small">
        <p className="eyebrow">No outcome claim yet</p>
        <h1>The test that would <span className="hl">prove it</span>.</h1>
        <p className="lede">Randomize stores, not patients. The same pharmacist would otherwise carry the desk's habits to usual-care patients.</p>
      </section>

      <ol className="pflow" aria-label="Pilot design">
        <li className="pstep"><span className="mono">Pick stores</span><strong>Pairs matched on weekly GLP-1 starts and pharmacist hours</strong></li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="pstep"><span className="mono">Randomize</span><strong>A coin flip within each pair</strong></li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="parms">
          <div className="pstep arm"><span className="mono">Usual care</span><strong>Counseling at pickup, as stores give it today</strong></div>
          <div className="pstep arm hot"><span className="mono">Start Desk</span><strong>The desk's daily list, faxes and calls</strong></div>
        </li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="pstep"><span className="mono">Week 12</span><strong>Supply covering week 12, by arm, from claims</strong></li>
      </ol>

      <div className="pcards">
        {CARDS.map((c) => (
          <article key={c.title} className="mcard">
            <h3>{c.title}</h3>
            <ul className="plist">{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          </article>
        ))}
      </div>

      <section className="checked" aria-label="Size and guardrails">
        <h2>Before the first patient</h2>
        <ul>
          <li><span className="tick-mark" aria-hidden="true">✓</span>Size it from the stores' own prior-year week 12 rate, not a guessed effect</li>
          <li><span className="tick-mark" aria-hidden="true">✓</span>Set the margin that would justify selling it, in writing</li>
          <li><span className="tick-mark" aria-hidden="true">✓</span>Both arms keep usual counseling. No patient is denied a pharmacist</li>
          <li><span className="tick-mark" aria-hidden="true">✓</span>Every dose decision stays with the prescriber in both arms</li>
        </ul>
      </section>
    </div>
  );
}
