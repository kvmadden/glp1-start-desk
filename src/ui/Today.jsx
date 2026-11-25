import React, { useEffect, useMemo, useState } from 'react';
import { Chip, Cite, Ladder, MiniLadder } from './bits.jsx';
import { dateLabel, dayName, firstName, COVERAGE, USE, KIND, PRIORITY } from './format.js';
import { EFFECT_LABEL, FLAGS } from '../engine/desk.js';

// What to say on each kind of call. The desk's own `say` lines are added after these.
export function script(p, a, prod) {
  const n = firstName(p.name);
  const t = a.action.type;
  if (a.action.kind === 'hold') {
    return [
      `${n}, please do not take your next ${prod.brand} dose until your prescriber tells you to.`,
      a.action.care,
      `I am calling ${p.prescriber.name} now and will call you back today.`,
    ];
  }
  if (t === 'other-drug') {
    return [`${n}, I am asking your prescriber whether your ${p.meds.includes('insulin') ? 'insulin' : 'diabetes pill'} dose should come down now that ${prod.brand} is working.`, 'Until you hear back, check your sugar if you feel shaky, sweaty or confused, and treat a low the way your care team showed you.'];
  }
  if (t === 'reassess') {
    return [`${n}, I am asking your prescriber what to do about the side effects on this dose.`, 'Until they answer, keep sipping fluids, eat small meals, and call me if you cannot keep anything down.'];
  }
  if (t === 'refill') {
    return a.missedDoses === 1
      ? [`Your last box ran out ${a.coverage.gapDays} days ago. Your ${a.current}\u00a0mg is ready.`, `The ${prod.brand} rule for a missed dose: ${prod.missedRule.charAt(0).toLowerCase() + prod.missedRule.slice(1)}`, 'What got in the way this time?']
      : [`Your ${a.current}\u00a0mg runs out ${dayName(a.nextFillDay)}. Want me to fill it today so you do not miss a week?`];
  }
  if (t === 'cost') {
    return [`Your savings card ends before your next fill, so the next box could cost $${p.card.copayWithout}.`, 'Do you want me to check whether the card renews, or ask your prescriber about an option your plan covers at a lower cost?', 'If cost will stop you, tell me now. Stopping in the middle of a step is harder to restart than a plan made with your prescriber.'];
  }
  if (t === 'stock') {
    return [`Your next step, ${a.next || a.current}\u00a0mg, is out at this store. I have ordered it.`, `It should be here before your supply ends ${dayName(a.nextFillDay)}. If it is not, I will call and we will find it at a nearby store.`];
  }
  if (t === 'bridge') {
    return ['Medicare drug plans do not cover this medicine when weight is the only reason it is used.', 'The Medicare GLP-1 Bridge may cover it for $50 a month through December 2027. Let me check whether you qualify before your next fill.'];
  }
  if (t === 'procedure') {
    return ['You mentioned a procedure coming up.', 'Please tell the surgeon and the anesthesia team you take this medicine. It slows how fast your stomach empties, which matters under sedation.', 'They will tell you whether to change anything before the procedure.'];
  }
  if (t === 'checkin') {
    return a.week <= 2
      ? [`How was your first ${a.current}\u00a0mg dose, ${n}?`, 'Any nausea, vomiting, belly pain, or trouble keeping fluids down?', `Your next step is ${a.next}\u00a0mg around ${dateLabel(a.stepDueDay)}. I will make sure the prescription is here first.`]
      : [`How is the new ${a.current}\u00a0mg dose going?`, 'Nausea right after a step is common. Is it mild, or is it stopping you from eating or drinking?', 'If it is more than mild, I can ask your prescriber about staying on this dose longer before the next step.'];
  }
  return [];
}

function FaxSheet({ p, a, prod, store, sent }) {
  return (
    <div className={sent ? 'fax gone' : 'fax'}>
      <div className="faxtop"><span className="mono">FAX</span><span className="mono">Page 1 of 1</span></div>
      <dl>
        <dt>To</dt><dd>{p.prescriber.name}, {p.prescriber.practice}</dd>
        <dt>From</dt><dd>Pharmacist, {store.name} (synthetic)</dd>
        <dt>Re</dt><dd>{p.name}, {p.age}. {prod.brand} {a.current}&nbsp;mg weekly, week {a.week}</dd>
      </dl>
      <p className="ask">{a.action.ask}</p>
      <p className="reply mono">{(a.action.reply || ['Agree, prescription sent', 'Keep current dose', 'Call me']).map((r) => <span key={r}>[ ] {r}</span>)}</p>
      <p className="refs">Days covered since the first fill: {a.coverage.covered} of {a.coverage.elapsed}.{a.coverage.gapDays > 0 ? ` No supply for the last ${a.coverage.gapDays} days.` : ''} Last side-effect check: {a.lastReport ? `${dateLabel(a.lastReport.day)}, ${a.lastReport.effects.filter((e) => !FLAGS.includes(e.key)).length ? a.lastReport.effects.filter((e) => !FLAGS.includes(e.key)).map((e) => `${EFFECT_LABEL[e.key].toLowerCase()} (${e.level})`).join(', ') : 'none reported'}` : 'none yet'}.</p>
    </div>
  );
}

function ActionCard({ p, a, prod, store, done, markDone }) {
  const k = KIND[a.action.kind];
  const lines = [...script(p, a, prod), ...a.say].filter(Boolean);
  const isDone = !!done[p.id];
  const verb = a.action.kind === 'fax' ? 'Send fax' : a.action.kind === 'hold' ? 'Patient and prescriber reached' : 'Mark called';
  return (
    <article className={`acard ${k.tone}`}>
      <header>
        <Chip tone={k.tone}>{k.label}</Chip>
        {a.action.by != null && <span className="sub">{a.action.by <= 0 ? 'Today' : `By ${dayName(a.action.by)}`}</span>}
      </header>
      <h3>{a.action.title}</h3>
      <p className="why">{a.action.why}</p>
      {a.action.kind === 'fax' && (
        <div style={{ position: 'relative' }}>
          <FaxSheet p={p} a={a} prod={prod} store={store} sent={isDone} />
          {isDone && <span className="stamp">SENT {done[p.id]}</span>}
        </div>
      )}
      {lines.length > 0 && (
        <div className="say">
          <span className="sub">{a.action.kind === 'hold' ? 'Call the patient first' : a.action.kind === 'fax' ? 'Then tell the patient' : 'What to say'}</span>
          <ol>{lines.map((l) => <li key={l}>{l}</li>)}</ol>
        </div>
      )}
      {a.action.kind === 'none' && lines.length === 0 && <p className="sub">The desk looks again on {dateLabel(Math.max(1, (a.stepDueDay ?? a.nextFillDay) - 3))}, three days before the next fill.</p>}
      <footer>
        {a.action.kind !== 'none' && (isDone
          ? <span className="sent">✓ Done at {done[p.id]}</span>
          : <button className="primary" onClick={() => markDone(p.id)}>{verb}</button>)}
        <span className="cite">Rule: <Cite c={a.action.cite} /></span>
      </footer>
    </article>
  );
}

function Effects({ a }) {
  const r = a.report;
  const tol = a.tolerability;
  const effects = r ? r.effects.filter((e) => !FLAGS.includes(e.key)) : [];
  const flags = r ? r.effects.filter((e) => FLAGS.includes(e.key)) : [];
  const tone = !r ? 'plain' : { hold: 'coral', 'other-drug': 'coral', slow: 'amber', lower: 'amber', reassess: 'amber', continue: 'pine' }[tol.call];
  const label = !r ? 'No report yet' : { hold: 'Hold', 'other-drug': 'Ask about the other drug', slow: 'Slow down', lower: 'Lower maintenance', reassess: 'Reassess', continue: 'Continue' }[tol.call];
  return (
    <section className="card">
      <header><h3>Side effects</h3><Chip tone={tone}>{label}</Chip></header>
      {flags.length > 0 && <ul className="flags">{flags.map((e) => <li key={e.key}><i className="bdot coral" />{EFFECT_LABEL[e.key]}</li>)}</ul>}
      {effects.length > 0 && <ul className="effects">{effects.map((e) => <li key={e.key}><span>{EFFECT_LABEL[e.key]}</span><span className={`lvl l${e.level}`}>{e.level}</span></li>)}</ul>}
      {r && !effects.length && !flags.length && <p style={{ marginTop: 0 }}>None reported on {dateLabel(r.day)}.</p>}
      <p className="sub" style={{ margin: 0 }}>{r && (effects.length || flags.length) ? `Reported ${dateLabel(r.day)}. ${tol.why} ` : r ? '' : 'The first check-in records any side effects. '}Every dose decision goes to the prescriber.</p>
    </section>
  );
}

function NextFill({ p, a }) {
  if (a.action.kind === 'hold') {
    return (
      <section className="card">
        <header><h3>Next fill</h3><span className="sub">On hold</span></header>
        <p className="okline"><i className="bdot coral" />No fill until the prescriber decides.</p>
      </section>
    );
  }
  const late = a.coverage.gapDays > 0;
  return (
    <section className="card">
      <header><h3>{late ? 'Supply' : 'Before the next fill'}</h3><span className="sub">{late ? `ran out ${dateLabel(a.nextFillDay)}` : dateLabel(a.nextFillDay)}</span></header>
      {late && <p className="okline"><i className="bdot coral" />No supply for {a.coverage.gapDays} days, {a.missedDoses} weekly {a.missedDoses === 1 ? 'dose' : 'doses'} missed.</p>}
      {a.blockers.length ? (
        <ul className="blockers">{a.blockers.map((b) => <li key={b.key}><i className={b.key === 'bridge' || b.key === 'card' ? 'bdot amber' : 'bdot'} />{b.label}</li>)}</ul>
      ) : !late && <p className="okline"><span className="tick">✓</span>Prescription on file{p.pa ? ', approval covers it' : ''}{p.card ? ', savings card active' : ''}. Nothing blocking.</p>}
    </section>
  );
}

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function Today({ data, initial }) {
  const [filter, setFilter] = useState('all');
  const [done, setDone] = useState({});
  const all = data.order.map((id) => data.patients[id]);
  const counts = Object.fromEntries(PRIORITY.map((g) => [g.key, all.filter((x) => x.analysis.priority === g.key).length]));
  const groups = PRIORITY.filter((g) => filter === 'all' || filter === g.key).map((g) => ({ ...g, rows: all.filter((x) => x.analysis.priority === g.key) }));
  const visible = groups.flatMap((g) => g.rows);
  const [sel, setSel] = useState(initial && data.patients[initial] ? initial : all[0].id);
  const [sheet, setSheet] = useState(!!(initial && data.patients[initial]));
  useEffect(() => { if (!visible.some((x) => x.id === sel)) setSel(visible[0]?.id); }, [filter]);
  useEffect(() => {
    document.body.style.overflow = sheet && window.matchMedia('(max-width: 760px)').matches ? 'hidden' : '';
  }, [sheet]);
  const p = data.patients[sel];
  const left = all.filter((x) => x.analysis.priority === 'now' && !done[x.id]).length;
  const markDone = (id) => setDone({ ...done, [id]: now() });
  return (
    <div className="page desk">
      <div className="deskhead">
        <div>
          <h1>{left ? `${left} ${left === 1 ? 'thing cannot' : 'things cannot'} wait today` : 'Everything urgent is done'}</h1>
          <p className="sub" style={{ margin: 0 }}>{all.length} patients in their first 12 weeks. Holds first, then by the last day each action still works.</p>
          <div className="daybar" aria-hidden="true">
            {PRIORITY.map((g) => <span key={g.key} className={g.key} style={{ flexGrow: counts[g.key] }} />)}
          </div>
        </div>
        <div className="seg" role="radiogroup" aria-label="Show">
          <button role="radio" aria-checked={filter === 'all'} className={filter === 'all' ? 'segbtn on' : 'segbtn'} onClick={() => setFilter('all')}>All <span className="n">{all.length}</span></button>
          {PRIORITY.map((g) => (
            <button key={g.key} role="radio" aria-checked={filter === g.key} className={filter === g.key ? 'segbtn on' : 'segbtn'} onClick={() => setFilter(g.key)}>
              <i className={`pdot ${g.key}`} />{g.label} <span className="n">{counts[g.key]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="split">
        <div className="listcol" key={filter}>
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <div className="grouphead"><span>{g.label}</span><span>{g.hint}</span></div>
              <ol className="group">
                {g.rows.map((x, i) => {
                  const a = x.analysis;
                  const k = KIND[a.action.kind];
                  const prod = data.products[x.product];
                  return (
                    <li key={x.id}>
                      <button className={`row${sel === x.id ? ' on' : ''}${done[x.id] ? ' done' : ''}`} style={{ animationDelay: `${Math.min(i, 12) * 22}ms` }} onClick={() => { setSel(x.id); setSheet(true); if (!window.matchMedia('(max-width: 760px)').matches) window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={sel === x.id}>
                        <i className={`pdot ${a.priority}`} />
                        <span className="who">
                          <strong>{x.name}</strong>
                          <span className="sub">{prod.brand} {a.current}&nbsp;mg · week {a.week}</span>
                        </span>
                        <span className="when">
                          <MiniLadder steps={prod.steps} current={a.current} next={a.next} target={x.target} />
                          {a.action.by != null && <span className={a.action.by <= 0 ? 'due now' : 'due'}>{done[x.id] ? 'done' : a.action.by <= 0 ? 'today' : dateLabel(a.action.by)}</span>}
                        </span>
                        <span className="act">{a.action.kind !== 'hold' && <span className="kind">{k.label}</span>}<span>{a.action.title}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <section className={sheet ? 'detail open' : 'detail'} aria-live="polite" key={p.id}>
          <div className="dhead">
            <button className="ghost back" onClick={() => setSheet(false)}>← All patients</button>
            <h2>{p.name}</h2>
            <p className="sub">{p.age} · {p.uses.map((u) => USE[u]).join(', ')} · {COVERAGE[p.coverage]} · {p.prescriber.name}, {p.prescriber.practice}</p>
          </div>
          <ActionCard p={p} a={p.analysis} prod={data.products[p.product]} store={data.store} done={done} markDone={markDone} />
          <section className="card">
            <header>
              <h3>{data.products[p.product].brand}, week {p.analysis.week} of 12</h3>
              <span className="sub">{p.analysis.coverage.covered} of {p.analysis.coverage.elapsed} days covered</span>
            </header>
            <Ladder p={p} product={data.products[p.product]} a={p.analysis} held={p.analysis.action.kind === 'hold' || p.analysis.action.type === 'restart'} />
            <p className="sub ladderfoot">Label steps {data.products[p.product].steps.join(', ')}&nbsp;mg, at least 4 weeks each. Prescriber's target {p.target}&nbsp;mg. {data.products[p.product].missedRule} <Cite c={data.products[p.product].schedule} /></p>
          </section>
          <div className="twocol">
            <Effects a={p.analysis} />
            <NextFill p={p} a={p.analysis} />
          </div>
        </section>
      </div>
    </div>
  );
}
