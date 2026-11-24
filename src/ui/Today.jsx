import React, { useEffect, useMemo, useState } from 'react';
import { Chip, Cite, Ladder } from './bits.jsx';
import { dateLabel, dayName, firstName, COVERAGE, USE, KIND } from './format.js';
import { EFFECT_LABEL } from '../engine/desk.js';

// What to say on each kind of call. The desk's `say` lines are added after these.
function script(p, a, prod) {
  const n = firstName(p.name);
  const t = a.action.type;
  if (a.action.kind === 'hold') {
    return [
      `${n}, please do not take your next ${prod.brand} dose until your prescriber tells you to.`,
      a.action.care,
      `I am calling ${p.prescriber.name} now and will call you back today.`,
    ];
  }
  if (t === 'refill') {
    return a.missedDoses === 1
      ? [`Your last box ran out ${a.coverage.gapDays} days ago. Your ${a.current} mg is ready.`, `If your missed dose is more than ${prod.missedWindowDays} days late, skip it and take the next one on your usual day. That is the ${prod.brand} label rule.`, 'What got in the way this time?']
      : [`Your ${a.current} mg runs out ${dayName(a.nextFillDay)}. Want me to fill it today so you do not miss a week?`];
  }
  if (t === 'cost') {
    return [`Your savings card ends before your next fill, so the next box could cost $${p.card.copayWithout}.`, 'Do you want me to check whether the card renews, or ask your prescriber about an option your plan covers at a lower cost?', 'If cost will stop you, tell me now. Stopping in the middle of a step is harder to restart than a plan made with your prescriber.'];
  }
  if (t === 'stock') {
    return [`Your next step, ${a.next || a.current} mg, is out at this store. I have ordered it.`, `It should be here before your supply ends ${dayName(a.nextFillDay)}. If it is not, I will call and we will find it at a nearby store.`];
  }
  if (t === 'bridge') {
    return ['Medicare drug plans do not cover this medicine when weight is the only reason it is used.', 'The Medicare GLP-1 Bridge may cover it for $50 a month through December 2027. Let me check whether you qualify before your next fill.'];
  }
  if (t === 'procedure') {
    return ['You mentioned a procedure coming up.', 'Please tell the surgeon and the anesthesia team you take this medicine. The label asks for that because food can stay in the stomach longer under sedation.'];
  }
  if (t === 'checkin') {
    return a.week <= 2
      ? [`How was your first ${a.current} mg dose, ${n}?`, 'Any nausea, vomiting, belly pain, or trouble keeping fluids down?', `Your next step is ${a.next} mg around ${dateLabel(a.stepDueDay)}. I will make sure the prescription is here first.`]
      : [`How is the new ${a.current} mg dose going?`, 'Nausea right after a step is common. Is it mild, or is it stopping you from eating or drinking?', 'If it is more than mild, I can ask your prescriber about staying on this dose longer before the next step.'];
  }
  return [];
}

function FaxSheet({ p, a, prod, store }) {
  return (
    <div className="fax">
      <div className="faxtop"><span className="mono">FAX</span><span className="mono">Page 1 of 1</span></div>
      <dl>
        <dt>To</dt><dd>{p.prescriber.name}, {p.prescriber.practice}</dd>
        <dt>From</dt><dd>Pharmacist, {store.name} (synthetic)</dd>
        <dt>Re</dt><dd>{p.name}, {p.age}. {prod.brand} {a.current} mg weekly, week {a.week}</dd>
      </dl>
      <p className="ask">{a.action.ask}</p>
      <p className="reply mono">[ ] Agree, prescription sent   [ ] Keep current dose   [ ] Call me</p>
      <p className="refs">Days covered since start: {a.coverage.covered} of {a.coverage.elapsed}. Last side-effect check: {a.report ? `${dateLabel(a.report.day)}, ${a.report.effects.length ? a.report.effects.map((e) => `${EFFECT_LABEL[e.key].toLowerCase()} (${e.level})`).join(', ') : 'none reported'}` : 'none yet'}. Reference: <Cite c={a.action.cite} /></p>
    </div>
  );
}

function ActionCard({ p, a, prod, store, done, setDone }) {
  const k = KIND[a.action.kind];
  const lines = [...script(p, a, prod), ...a.say].filter(Boolean);
  const isDone = done[p.id];
  return (
    <article className={`acard ${k.tone}`}>
      <header>
        <Chip tone={k.tone}>{k.label}</Chip>
        <span className="sub">{a.action.by == null ? '' : a.action.by <= 0 ? 'Today' : `By ${dayName(a.action.by)}`}</span>
      </header>
      <h3>{a.action.title}</h3>
      <p className="why">{a.action.why}</p>
      {a.action.kind === 'fax' && <FaxSheet p={p} a={a} prod={prod} store={store} />}
      {lines.length > 0 && (
        <div className="say">
          <span className="sub">{a.action.kind === 'hold' ? 'Call the patient first' : a.action.kind === 'fax' ? 'Then tell the patient' : 'Say'}</span>
          <ul>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
      )}
      {a.action.kind === 'none' && a.say.length === 0 && <p className="sub">Next look: {dateLabel(Math.max(1, (a.stepDueDay ?? a.nextFillDay) - 3))}, three days before the next fill.</p>}
      <footer>
        {a.action.kind !== 'none' && (
          <button className="primary" disabled={isDone} onClick={() => setDone({ ...done, [p.id]: true })}>{isDone ? 'Done' : a.action.kind === 'fax' ? 'Send fax' : 'Mark done'}</button>
        )}
        <span className="sub">Rule: <Cite c={a.action.cite} /></span>
      </footer>
    </article>
  );
}

function Effects({ a }) {
  const r = a.report;
  const tol = a.tolerability;
  const tone = { hold: 'brick', 'other-drug': 'brick', slow: 'gold', lower: 'gold', continue: 'teal' }[tol.call];
  const label = { hold: 'Hold', 'other-drug': 'Ask about the other drug', slow: 'Slow down', lower: 'Lower maintenance', continue: 'Continue' }[tol.call];
  return (
    <section className="mcard">
      <header><h3>Side effects</h3><Chip tone={tone}>{label}</Chip></header>
      {r ? (
        <>
          <p className="sub">Reported {dateLabel(r.day)}</p>
          {r.effects.length ? (
            <ul className="effects">{r.effects.map((e) => <li key={e.key}><span>{EFFECT_LABEL[e.key]}</span><span className={`lvl l${e.level}`}>{e.level}</span></li>)}</ul>
          ) : <p>None reported.</p>}
        </>
      ) : <p className="sub">No check-in yet.</p>}
      <p className="sub">{r ? `${tol.why} ` : ""}Every dose decision goes to the prescriber.</p>
    </section>
  );
}

export default function Today({ data, staffing, setStaffing }) {
  const [done, setDone] = useState({});
  const [sel, setSel] = useState(null);
  const [sheet, setSheet] = useState(false);
  const all = data.order.map((id) => data.patients[id]);
  const short = staffing === 'short';
  const rows = useMemo(() => (short ? all.filter((p) => p.analysis.mustToday) : all), [short, data]);
  const later = all.filter((p) => !p.analysis.mustToday && p.analysis.action.kind !== 'none');
  useEffect(() => setSel(rows[0]?.id || null), [short]);
  const p = sel ? data.patients[sel] : null;
  const counts = { must: all.filter((x) => x.analysis.mustToday).length, later: later.length, none: all.filter((x) => x.analysis.action.kind === 'none').length };
  return (
    <div className="page list">
      <div className="listhead">
        <div>
          <h1 className="h2">{short ? `${counts.must} things cannot wait today` : `${all.length} patients in their first 12 weeks`}</h1>
          <p className="sub">{short ? `Short-staffed: everything else shows the last day it can wait until. ${counts.later} can wait, ${counts.none} need nothing.` : `${counts.must} today, ${counts.later} later this week, ${counts.none} on track. Holds first, then by the last day each action still works.`}</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Staffing today">
          <button role="radio" aria-checked={!short} className={!short ? 'segbtn on' : 'segbtn'} onClick={() => setStaffing('full')}>Full staff</button>
          <button role="radio" aria-checked={short} className={short ? 'segbtn on' : 'segbtn'} onClick={() => setStaffing('short')}>Short-staffed</button>
        </div>
      </div>
      <div className="split">
        <div>
          <ol className="rows">
            {rows.map((x) => {
              const a = x.analysis;
              const k = KIND[a.action.kind];
              return (
                <li key={x.id}>
                  <button className={sel === x.id ? 'row on' : 'row'} onClick={() => { setSel(x.id); setSheet(true); }}>
                    <span className={`rank kdot ${k.tone}`} aria-hidden="true" />
                    <span className="who">
                      <strong>{x.name}</strong>
                      <span className="sub">{data.products[x.product].brand} {a.current} mg · week {a.week}</span>
                    </span>
                    <span className="when">
                      <span className="mono">{a.action.by == null ? '' : a.action.by <= 0 ? 'today' : dateLabel(a.action.by)}</span>
                      <span className="sub">{done[x.id] ? 'done' : k.label}</span>
                    </span>
                    <span className="fixlabel">{a.action.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {short && later.length > 0 && (
            <details className="waits">
              <summary>{later.length} can wait, and until when</summary>
              <ul className="plain">
                {later.map((x) => <li key={x.id}><span>{x.name}: {x.analysis.action.title}</span><span className="sub">by {dayName(x.analysis.action.by)}</span></li>)}
              </ul>
            </details>
          )}
        </div>
        <section className={sheet ? 'detail open' : 'detail'} aria-live="polite">
          {p && (
            <>
              <div className="dhead">
                <button className="ghost back" onClick={() => setSheet(false)}>Back to list</button>
                <h2>{p.name}</h2>
                <p className="sub">{p.age} · {p.uses.map((u) => USE[u]).join(', ')} · {COVERAGE[p.coverage]} · {p.prescriber.name}, {p.prescriber.practice}</p>
              </div>
              <ActionCard p={p} a={p.analysis} prod={data.products[p.product]} store={data.store} done={done} setDone={setDone} />
              <section className="mcard">
                <header>
                  <h3>{data.products[p.product].brand} dose, week {p.analysis.week} of 12</h3>
                  <span className="sub">Covered {p.analysis.coverage.covered} of {p.analysis.coverage.elapsed} days since the first fill</span>
                </header>
                <Ladder p={p} product={data.products[p.product]} a={p.analysis} />
                <p className="sub">Label ladder: {data.products[p.product].steps.join(', ')} mg, at least 4 weeks each. Prescriber's target: {p.target} mg. Missed dose window: {data.products[p.product].missedWindowDays} days. <Cite c={data.products[p.product].schedule} /></p>
              </section>
              <Effects a={p.analysis} />
              <section className="mcard">
                <header><h3>Before the next fill, {dateLabel(p.analysis.nextFillDay)}</h3></header>
                {p.analysis.blockers.length ? (
                  <ul className="blockers">{p.analysis.blockers.map((b) => <li key={b.key}><Chip tone={b.key === 'bridge' || b.key === 'card' ? 'gold' : 'slate'}>{b.label}</Chip></li>)}</ul>
                ) : <p>Nothing blocking. Prescription on file{p.pa ? ', prior authorization covers it' : ''}{p.card ? ', savings card active' : ''}.</p>}
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
