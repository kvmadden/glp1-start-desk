// Direction C, "Label". Drawn from the pharmacy itself: the dark counter after close, white
// prescription stock, and the colored auxiliary stickers pharmacists put on bottles. Each sticker
// color means one kind of break. The calendar of breaks is the centerpiece.
import React, { useEffect } from 'react';
import { REASONS, REASONS_SOURCE, SEES, SEES_NOTE, WHO } from '../../ui/Insight.jsx';
import { Ladder, Cite } from '../../ui/bits.jsx';
import { dateLabel, firstName, COVERAGE, USE, PRIORITY } from '../../ui/format.js';
import Plans from '../../ui/Plans.jsx';
import Pilot from '../../ui/Pilot.jsx';
import { breakPoints, BREAK_LANES, useDesk, detailOf, headline, isPhone, loadFonts, TABS } from '../shared.jsx';
import './c.css';

const KINDS = [
  { kind: 'money', label: 'Money', what: 'card ends, coverage gap' },
  { kind: 'supply', label: 'Supply', what: 'out of stock, already out' },
  { kind: 'paperwork', label: 'Paperwork', what: 'no Rx, old approval' },
  { kind: 'clinical', label: 'Body', what: 'side effects, red flags' },
];

function Top({ tab, store }) {
  return (
    <header className="c-top">
      <a className="c-word" href="#/why"><span className="c-rx" aria-hidden="true">Rx</span>GLP-1 Start Desk</a>
      <nav className="c-nav" aria-label="Sections">
        {TABS.map((t) => <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}>{t.label}</a>)}
      </nav>
      <span className="c-meta">{store.name} · synthetic · {dateLabel(0)}, 2026</span>
    </header>
  );
}

// Each reason's number is set at a size in proportion to its share, with a rule underneath for the exact read.
function TypeChart() {
  const kindClass = { money: 'money', supply: 'supply', clinical: 'clinical', quiet: 'quiet' };
  return (
    <ol className="c-type" aria-label="Reasons for stopping">
      {REASONS.map((r) => (
        <li key={r.label} className={kindClass[r.kind]} style={{ '--v': r.pct }}>
          <span className="c-big">{r.pct}<small>%</small></span>
          <span className="c-why">{r.label}</span>
          <span className="c-rule"><i /></span>
        </li>
      ))}
    </ol>
  );
}

// A wall calendar: three weeks, Monday first, each patient a sticker on the day their break hits.
function Calendar({ data, go }) {
  const pts = breakPoints(data);
  const kindOf = Object.fromEntries(BREAK_LANES.map((b) => [b.key, b.kind]));
  const labelOf = Object.fromEntries(BREAK_LANES.map((b) => [b.key, b.label]));
  // Today, Nov 24 2026, is a Tuesday, so the first Monday is day -1.
  const start = -1;
  const cells = Array.from({ length: 21 }, (_, i) => start + i);
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="c-cal">
      <div className="c-calhead" aria-hidden="true">{names.map((n) => <span key={n}>{n}</span>)}</div>
      <div className="c-calgrid">
        {cells.map((d) => {
          const here = d >= 0 && d <= 14 ? pts.filter((q) => Math.min(q.b.day, 14) === d) : [];
          const out = d < 0 || d > 14;
          return (
            <div key={d} className={`c-day${out ? ' out' : ''}${d === 0 ? ' today' : ''}`}>
              <span className="c-date">{d === 0 ? 'Today' : dateLabel(d).replace(/^(\w+) (\d+)$/, (m, mo, dd) => (dd === '1' ? `${mo} 1` : dd))}<span className="c-dow">{names[(d - start) % 7]}</span></span>
              {here.length > 0 && (
                <span className="c-stickers">
                  {here.map((q) => (
                    <button key={q.p.id} className={`c-stk ${kindOf[q.b.key]}`} onClick={() => go('desk', q.p.id)} title={labelOf[q.b.key]} aria-label={`${q.p.name}, ${labelOf[q.b.key]}`}>{firstName(q.p.name)}</button>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <ul className="c-key">
        {KINDS.map((k) => <li key={k.kind}><i className={`c-dotk ${k.kind}`} /><b>{k.label}</b> {k.what}</li>)}
      </ul>
    </div>
  );
}

function Mark({ s }) {
  return <span className={`c-mark ${s}`} aria-label={s === 'yes' ? 'Sees it' : s === 'maybe' ? 'Sometimes' : 'Does not see it'} />;
}

function Counters() {
  return (
    <div className="c-who" role="table" aria-label="Who sees each break before the patient stops">
      <div className="c-wrow c-whead" role="row">
        <span role="columnheader" />
        {WHO.map((w) => <span key={w} role="columnheader" className={w === 'Pharmacy' ? 'hot' : ''}>{w}</span>)}
      </div>
      {BREAK_LANES.filter((b) => SEES[b.key]).map((b) => (
        <div className="c-wrow" role="row" key={b.key}>
          <span role="rowheader" className="c-wlabel"><i className={`c-dotk ${b.kind}`} />{b.label}</span>
          {SEES[b.key].map((s, i) => (
            <span role="cell" key={i} className={i === 2 ? 'hot' : ''}>
              <Mark s={s} />
              {SEES_NOTE[b.key][i] && <small>{SEES_NOTE[b.key][i]}</small>}
            </span>
          ))}
        </div>
      ))}
      <p className="c-fine"><Mark s="yes" /> sees it in the normal course of work <Mark s="maybe" /> only sometimes <Mark s="no" /> does not see it. Kevin's read of who holds the information today, from more than 15 years in pharmacy, not a measured result.</p>
    </div>
  );
}

function Insight({ data, go }) {
  return (
    <div className="c-insight">
      <section className="c-hero">
        <div>
          <h1>Most GLP-1 stops are about <span className="c-hi">money and supply</span>, not side effects.</h1>
          <p className="c-lede">Share of 288 people who stopped, by the reason in their chart. Money and shortage together: 59.4%.</p>
          <p className="c-fine"><a href={REASONS_SOURCE.url} target="_blank" rel="noreferrer">Gasoyan et al., Obesity, 2026, one health system's chart review, via Cleveland Clinic</a></p>
        </div>
        <TypeChart />
      </section>
      <section className="c-sec">
        <header className="c-sechead">
          <h2>Each break has a date the pharmacy can see coming.</h2>
          <p className="c-lede">Every step up is a new strength, a new prescription, often a new approval. The supply runs out on a known day. Here are 32 synthetic patients on the day each one's next break hits. Tap a name to open the patient.</p>
        </header>
        <Calendar data={data} go={go} />
      </section>
      <section className="c-sec">
        <header className="c-sechead">
          <h2>Only the pharmacy sees all of them.</h2>
          <p className="c-lede">The prescriber and the plan each hold part of the picture. The counter holds the whole thing, days before the patient gives up.</p>
        </header>
        <Counters />
      </section>
      <section className="c-sec c-end">
        <h2>So the desk turns each break into one action, dated before it hits.</h2>
        <div className="c-ctas">
          <button className="c-btn" onClick={() => go('desk')}>Open today's work list</button>
          <button className="c-btn2" onClick={() => go('plans')}>What a plan would pay for</button>
        </div>
      </section>
    </div>
  );
}

function Action({ p, data, desk, d }) {
  const a = d.a;
  return (
    <div className="c-action">
      <button className="c-back" onClick={desk.close}>← All patients</button>
      <p className="c-patient"><strong>{p.name}</strong><span>{p.age} · {p.uses.map((u) => USE[u]).join(', ')} · {COVERAGE[p.coverage]}</span><span>{p.prescriber.name}, {p.prescriber.practice}</span></p>
      <p className="c-kindrow"><span className={`c-chip ${d.k.tone}`}>{d.k.label}</span>{d.when && <span className="c-when">{d.when}</span>}</p>
      <h2>{a.action.title}</h2>
      <p className="c-lede">{a.action.why}</p>
      {d.fax && (
        <div className="c-faxwrap">
          <div className={d.isDone ? 'c-fax gone' : 'c-fax'}>
            <div className="c-faxtop"><span>FAX</span><span>{d.fax.from}</span><span>Page 1 of 1</span></div>
            <dl>
              <dt>To</dt><dd>{d.fax.to}</dd>
              <dt>Re</dt><dd>{d.fax.re}</dd>
            </dl>
            <p className="c-ask">{d.fax.ask}</p>
            <p className="c-reply">{d.fax.reply.map((r) => <span key={r}>☐ {r}</span>)}</p>
            <p className="c-refs">{d.fax.refs}</p>
          </div>
          {d.isDone && <span className="c-stamp">Sent {d.doneAt}</span>}
        </div>
      )}
      {d.lines.length > 0 && (
        <div className="c-say">
          <p className="c-label">{d.sayLabel}</p>
          <ol>{d.lines.map((l) => <li key={l}>{l}</li>)}</ol>
        </div>
      )}
      {d.quiet && <p className="c-fine">{d.quiet}</p>}
      <div className="c-act">
        {a.action.kind !== 'none' && (d.isDone ? <span className="c-done">✓ Done at {d.doneAt}</span> : <button className="c-btn" onClick={() => desk.markDone(p.id)}>{d.verb}</button>)}
        <span className="c-fine">Rule: <Cite c={d.cite} /></span>
      </div>
    </div>
  );
}

function Record({ p, d }) {
  const a = d.a;
  return (
    <div className="c-record">
      <section className="c-box">
        <header><h3>{d.prod.brand}, week {a.week} of 12</h3><span>{a.coverage.covered} of {a.coverage.elapsed} days covered</span></header>
        <Ladder p={p} product={d.prod} a={a} held={d.ladderHeld} compact />
        <p className="c-fine">{d.ladderFoot} <Cite c={d.schedule} /></p>
      </section>
      <section className="c-box">
        <header><h3>Side effects</h3><span className={`c-chip ${d.effects.tone}`}>{d.effects.label}</span></header>
        {d.effects.flags.map((f) => <p key={f} className="c-line stop">{f}</p>)}
        {d.effects.list.map((e) => <p key={e.key} className="c-line"><span>{e.label}</span><span className="c-lvl">{e.level}</span></p>)}
        {d.effects.none && <p className="c-line">{d.effects.none}</p>}
        <p className="c-fine">{d.effects.note}</p>
      </section>
      <section className="c-box">
        <header><h3>{d.fill.title}</h3><span>{d.fill.when}</span></header>
        {d.fill.lines.map((l) => <p key={l.text} className={`c-line ${l.tone}`}>{l.text}</p>)}
      </section>
    </div>
  );
}

function Desk({ data, initial }) {
  const desk = useDesk(data, initial);
  const total = desk.all.length;
  const d = detailOf(desk.p, data, desk.done);
  return (
    <div className="c-desk">
      <header className="c-deskhead">
        <div>
          <h1>{headline(desk.left)}</h1>
          <p className="c-lede">{total} patients in their first 12 weeks. Holds first, then by the last day each action still works.</p>
        </div>
        <div className="c-filter" role="radiogroup" aria-label="Show">
          {[{ key: 'all', label: 'All', n: total }, ...PRIORITY.map((g) => ({ key: g.key, label: g.label, n: desk.counts[g.key] }))].map((f) => (
            <button key={f.key} role="radio" aria-checked={desk.filter === f.key} className={`${f.key}${desk.filter === f.key ? ' on' : ''}`} onClick={() => desk.setFilter(f.key)}>{f.label}<span>{f.n}</span></button>
          ))}
        </div>
      </header>
      <div className="c-three">
        <div className="c-list">
          {desk.groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h4 className={`c-ghead ${g.key}`}>{g.label}<span>{g.hint}</span></h4>
              <ol>
                {g.rows.map((x) => {
                  const a = x.analysis;
                  const prod = data.products[x.product];
                  return (
                    <li key={x.id}>
                      <button className={`c-row${desk.sel === x.id ? ' on' : ''}${desk.done[x.id] ? ' done' : ''}`} onClick={() => { desk.open(x.id); if (!isPhone()) window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={desk.sel === x.id}>
                        <span className="c-rtop"><strong>{x.name}</strong>{a.action.by != null && <span className={a.action.by <= 0 ? 'c-due now' : 'c-due'}>{desk.done[x.id] ? 'done' : a.action.by <= 0 ? 'today' : dateLabel(a.action.by)}</span>}</span>
                        <span className="c-rdrug">{prod.brand} {a.current}&nbsp;mg · wk {a.week}</span>
                        <span className="c-ract">{a.action.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <div className={desk.sheet ? 'c-detail open' : 'c-detail'} key={desk.p.id} aria-live="polite">
          <Action p={desk.p} data={data} desk={desk} d={d} />
          <Record p={desk.p} d={d} />
        </div>
      </div>
    </div>
  );
}

export default function DirectionC({ data, tab, patient, go }) {
  useEffect(() => { loadFonts('c'); document.documentElement.classList.add('dir-c'); }, []);
  return (
    <div className="dC">
      <Top tab={tab} store={data.store} />
      <main key={tab}>
        {tab === 'why' && <Insight data={data} go={go} />}
        {tab === 'desk' && <Desk data={data} initial={patient} />}
        {tab === 'plans' && <div className="c-carry"><Plans /></div>}
        {tab === 'pilot' && <div className="c-carry"><Pilot /></div>}
      </main>
      <footer className="c-foot">
        <span>Synthetic patients. Dose rules from the FDA labels for Wegovy, Ozempic, Zepbound and Mounjaro. Every dose decision goes to the prescriber.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
