// Direction B, "Exhibit". A strategy-studio treatment: every chapter is a numbered exhibit with an
// action title, a source line and one chart. Navy ink, electric blue only for what the pharmacy can
// act on (money and supply), Harvey balls for who sees what, and a ledger table for the work list.
import React, { useEffect, useRef, useState } from 'react';
import { REASONS, REASONS_SOURCE, SEES, SEES_NOTE, WHO } from '../../ui/Insight.jsx';
import { Ladder, Cite, useNarrow } from '../../ui/bits.jsx';
import { dateLabel, firstName, COVERAGE, USE, PRIORITY } from '../../ui/format.js';
import Plans from '../../ui/Plans.jsx';
import Pilot from '../../ui/Pilot.jsx';
import { breakPoints, BREAK_LANES, BREAK_SHORT, useDesk, detailOf, headline, isPhone, loadFonts, TABS } from '../shared.jsx';
import './b.css';

function Bar({ tab, store }) {
  return (
    <header className="b-top">
      <a className="b-word" href="#/why"><span className="b-mark" aria-hidden="true" />GLP-1 Start Desk</a>
      <nav className="b-nav" aria-label="Sections">
        {TABS.map((t, i) => <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}><span className="b-n">0{i + 1}</span>{t.label}</a>)}
      </nav>
      <span className="b-meta">Synthetic data. {store.name}. {dateLabel(0)}, 2026</span>
    </header>
  );
}

function Exhibit({ n, title, children, source }) {
  return (
    <figure className="b-ex">
      <figcaption><span className="b-exn">Exhibit {n}</span><span className="b-ext">{title}</span></figcaption>
      {children}
      {source && <p className="b-src">{source}</p>}
    </figure>
  );
}

// Exhibit 1: reasons as columns, the actionable pair in blue.
function Columns() {
  const narrow = useNarrow();
  const W = narrow ? 358 : 820;
  const H = narrow ? 300 : 340;
  const B = 56;
  const T = 64;
  const colW = narrow ? 48 : 96;
  const gap = (W - REASONS.length * colW) / (REASONS.length + 1);
  const y = (v) => T + (1 - v / 50) * (H - T - B);
  const cx = (i) => gap + i * (colW + gap);
  const lab = { 'Money: denial, coupon ended, cost': ['Money', 'denial, coupon, cost'], Shortage: ['Shortage', ''], 'Side effects': ['Side effects', ''], Unknown: ['Unknown', ''], Other: ['Other', ''] };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="b-cols" role="img" aria-label="Reasons for stopping: money 47.6%, shortage 11.8%, side effects 14.6%, unknown 11.1%, other 10.8%">
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="b-base" />
      {REASONS.map((r, i) => {
        const hot = r.kind === 'money' || r.kind === 'supply';
        return (
          <g key={r.label} className={hot ? 'b-col hot' : 'b-col'}>
            <rect x={cx(i)} y={y(r.pct)} width={colW} height={H - B - y(r.pct)} />
            <text x={cx(i) + colW / 2} y={y(r.pct) - 10} textAnchor="middle" className="b-cv">{r.pct}%</text>
            <text x={cx(i) + colW / 2} y={H - B + 22} textAnchor="middle" className="b-cl">{narrow ? ['Money', 'Supply', 'Effects', 'Unknown', 'Other'][i] : lab[r.label][0]}</text>
            {lab[r.label][1] && !narrow && <text x={cx(i) + colW / 2} y={H - B + 40} textAnchor="middle" className="b-cl2">{lab[r.label][1]}</text>}
          </g>
        );
      })}
      <g className="b-brk">
        <path d={`M ${cx(0)} ${T - 28} v -10 h ${cx(1) + colW - cx(0)} v 10`} />
        <text x={narrow ? cx(0) : (cx(0) + cx(1) + colW) / 2} y={T - 46} textAnchor={narrow ? 'start' : 'middle'}>59.4% money and supply</text>
      </g>
    </svg>
  );
}

// Exhibit 2: a two-week grid, one square per patient on the day the break hits.
function Grid({ data, go }) {
  const narrow = useNarrow();
  const [hover, setHover] = useState(null);
  const pts = breakPoints(data);
  const days = Array.from({ length: 15 }, (_, d) => d);
  const kindOf = { paperwork: 'paper', money: 'money', supply: 'supply', clinical: 'clinical' };
  return (
    <div className="b-grid" style={{ '--days': days.length }}>
      <div className="b-grow b-ghead">
        <span />
        {days.map((d) => {
          const [mon, dom] = dateLabel(d).split(' ');
          const text = narrow ? (d % 7 === 0 ? dom : '') : d === 0 || dom === '1' ? `${mon} ${dom}` : dom;
          return <span key={d} className={d === 0 ? 'today' : ''}>{text}</span>;
        })}
        <span className="b-gn">n</span>
      </div>
      {BREAK_LANES.map((ln) => {
        const here = pts.filter((q) => q.b.key === ln.key);
        return (
          <div className="b-grow" key={ln.key}>
            <span className="b-glabel"><i className={kindOf[ln.kind]} />{narrow ? BREAK_SHORT[ln.key] : ln.label}</span>
            {days.map((d) => (
              <span key={d} className="b-cell">
                {here.filter((q) => Math.min(q.b.day, 14) === d).map((q) => (
                  <button key={q.p.id} className={`b-sq ${kindOf[ln.kind]}`} aria-label={`${q.p.name}: ${q.p.analysis.action.title}`} onClick={() => go('desk', q.p.id)} onMouseEnter={() => setHover(q)} onMouseLeave={() => setHover(null)} />
                ))}
              </span>
            ))}
            <span className="b-gn">{here.length}</span>
          </div>
        );
      })}
      <p className="b-hover" aria-live="polite">{hover ? `${firstName(hover.p.name)}: ${hover.p.analysis.action.title.toLowerCase()}. ${narrow ? 'Tap' : 'Click'} to open.` : `Each square is one synthetic patient. ${narrow ? 'Tap' : 'Click'} a square to open the patient.`}</p>
    </div>
  );
}

function Ball({ s }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={`b-ball ${s}`} aria-label={s === 'yes' ? 'Sees it' : s === 'maybe' ? 'Sometimes' : 'Does not see it'}>
      <circle cx="12" cy="12" r="10" />
      {s === 'maybe' && <path d="M12 2 A10 10 0 0 1 12 22 Z" />}
    </svg>
  );
}

function Matrix() {
  return (
    <div className="b-matrix" role="table" aria-label="Who sees each break before the patient stops">
      <div className="b-mrow b-mhead" role="row">
        <span role="columnheader" />
        {WHO.map((w) => <span key={w} role="columnheader" className={w === 'Pharmacy' ? 'hot' : ''}>{w}</span>)}
      </div>
      {BREAK_LANES.filter((b) => SEES[b.key]).map((b) => (
        <div className="b-mrow" role="row" key={b.key}>
          <span role="rowheader" className="b-mlabel">{b.label}</span>
          {SEES[b.key].map((s, i) => (
            <span role="cell" key={i} className={i === 2 ? 'hot' : ''}>
              <Ball s={s} />
              {SEES_NOTE[b.key][i] && <small>{SEES_NOTE[b.key][i]}</small>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const CHAPTERS = ['Why they stop', 'When it breaks', 'Who sees it', 'What the desk does'];

function Insight({ data, go }) {
  const [on, setOn] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setOn(+e.target.dataset.i); }), { rootMargin: '-45% 0px -50% 0px' });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  const sec = (i) => ({ ref: (el) => { refs.current[i] = el; }, 'data-i': i, id: `b-ch${i}` });
  return (
    <div className="b-insight">
      <nav className="b-index" aria-label="Exhibits">
        {CHAPTERS.map((c, i) => <a key={c} href={`#/why`} onClick={(e) => { e.preventDefault(); document.getElementById(`b-ch${i}`).scrollIntoView({ behavior: 'smooth' }); }} className={on === i ? 'on' : ''}><span>0{i + 1}</span>{c}</a>)}
      </nav>
      <div className="b-chapters">
        <section className="b-ch first" {...sec(0)}>
          <h1>Most GLP-1 stops are about money and supply, not side effects.</h1>
          <Exhibit n={1} title="Reasons for stopping, % of 288 people who stopped at one health system" source={<>Source: <a href={REASONS_SOURCE.url} target="_blank" rel="noreferrer">Gasoyan et al., Obesity, 2026, a chart review, via Cleveland Clinic</a></>}>
            <Columns />
          </Exhibit>
        </section>
        <section className="b-ch" {...sec(1)}>
          <h2>Each of those breaks has a date the pharmacy can see coming.</h2>
          <p className="b-lede">Every step up is a new strength, a new prescription, often a new approval. The supply runs out on a known day.</p>
          <Exhibit n={2} title="Next break for each of 32 synthetic patients, by the day it hits" source="Read from the prescription file, the approval, the card, the shelf or the last check-in. Synthetic patients, weighted toward the reasons in Exhibit 1.">
            <Grid data={data} go={go} />
          </Exhibit>
        </section>
        <section className="b-ch" {...sec(2)}>
          <h2>Only the pharmacy sees all of them.</h2>
          <p className="b-lede">The prescriber and the plan each hold part of the picture. The counter holds the whole thing, days before the patient gives up.</p>
          <Exhibit n={3} title="Who sees each break before the patient stops" source={<><span className="b-key"><Ball s="yes" /> in the normal course of work <Ball s="maybe" /> only sometimes <Ball s="no" /> not at all.</span> Kevin's read of who holds the information today, from more than 15 years in pharmacy, not a measured result.</>}>
            <Matrix />
          </Exhibit>
        </section>
        <section className="b-ch last" {...sec(3)}>
          <h2>So the desk turns each break into one action, dated before it hits.</h2>
          <div className="b-ctas">
            <button className="b-btn" onClick={() => go('desk')}>Open today's work list</button>
            <button className="b-btn2" onClick={() => go('plans')}>What a plan would pay for</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function WeekBar({ week }) {
  return (
    <span className="b-weeks" aria-label={`Week ${week} of 12`}>
      {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < week ? 'f' : ''} />)}
    </span>
  );
}

function Panel({ p, data, desk }) {
  const d = detailOf(p, data, desk.done);
  const a = d.a;
  return (
    <aside className={desk.sheet ? 'b-panel open' : 'b-panel'} aria-live="polite">
      <div className="b-phead">
        <button className="b-back" onClick={desk.close}>← All patients</button>
        <p className="b-pwho"><strong>{p.name}</strong> {p.age}, {p.uses.map((u) => USE[u]).join(', ').toLowerCase()}, {COVERAGE[p.coverage].toLowerCase()}<br />Prescriber {p.prescriber.name}, {p.prescriber.practice}</p>
        <p className="b-pkind"><span className={`b-pill ${d.k.tone}`}>{d.k.label}</span>{d.when && <span>{d.when}</span>}</p>
        <h2>{a.action.title}</h2>
        <p className="b-pwhy">{a.action.why}</p>
      </div>
      <div className="b-pbody">
        {d.fax && (
          <div className="b-faxwrap">
            <div className={d.isDone ? 'b-fax gone' : 'b-fax'}>
              <div className="b-faxtop"><span>Fax to prescriber</span><span>Page 1 of 1</span></div>
              <dl>
                <dt>To</dt><dd>{d.fax.to}</dd>
                <dt>From</dt><dd>{d.fax.from}</dd>
                <dt>Re</dt><dd>{d.fax.re}</dd>
              </dl>
              <p className="b-ask">{d.fax.ask}</p>
              <p className="b-reply">{d.fax.reply.map((r) => <span key={r}><i />{r}</span>)}</p>
              <p className="b-refs">{d.fax.refs}</p>
            </div>
            {d.isDone && <span className="b-stamp">Sent {d.doneAt}</span>}
          </div>
        )}
        {d.lines.length > 0 && (
          <div className="b-say">
            <h3>{d.sayLabel}</h3>
            <ol>{d.lines.map((l) => <li key={l}>{l}</li>)}</ol>
          </div>
        )}
        {d.quiet && <p className="b-small">{d.quiet}</p>}
        <div className="b-act">
          {a.action.kind !== 'none' && (d.isDone ? <span className="b-done">✓ Done at {d.doneAt}</span> : <button className="b-btn" onClick={() => desk.markDone(p.id)}>{d.verb}</button>)}
          <span className="b-small">Rule: <Cite c={d.cite} /></span>
        </div>
        <section className="b-sec">
          <header><h3>{d.prod.brand}, week {a.week} of 12</h3><span>{a.coverage.covered} of {a.coverage.elapsed} days covered</span></header>
          <Ladder p={p} product={d.prod} a={a} held={d.ladderHeld} width={560} />
          <p className="b-small">{d.ladderFoot} <Cite c={d.schedule} /></p>
        </section>
        <div className="b-two">
          <section className="b-sec">
            <header><h3>Side effects</h3><span className={`b-pill ${d.effects.tone}`}>{d.effects.label}</span></header>
            {d.effects.flags.map((f) => <p key={f} className="b-line stop">{f}</p>)}
            {d.effects.list.map((e) => <p key={e.key} className="b-line"><span>{e.label}</span><span className="b-lvl">{e.level}</span></p>)}
            {d.effects.none && <p className="b-line">{d.effects.none}</p>}
            <p className="b-small">{d.effects.note}</p>
          </section>
          <section className="b-sec">
            <header><h3>{d.fill.title}</h3><span>{d.fill.when}</span></header>
            {d.fill.lines.map((l) => <p key={l.text} className={`b-line ${l.tone}`}>{l.text}</p>)}
          </section>
        </div>
      </div>
    </aside>
  );
}

function Desk({ data, initial }) {
  const desk = useDesk(data, initial);
  const total = desk.all.length;
  return (
    <div className="b-desk">
      <header className="b-deskhead">
        <div>
          <h1>{headline(desk.left)}</h1>
          <p className="b-lede">{total} patients in their first 12 weeks. Holds first, then by the last day each action still works.</p>
        </div>
        <div className="b-seg" role="radiogroup" aria-label="Show">
          {[{ key: 'all', label: 'All', n: total }, ...PRIORITY.map((g) => ({ key: g.key, label: g.label, n: desk.counts[g.key] }))].map((f) => (
            <button key={f.key} role="radio" aria-checked={desk.filter === f.key} className={desk.filter === f.key ? 'on' : ''} onClick={() => desk.setFilter(f.key)}>{f.label}<span>{f.n}</span></button>
          ))}
        </div>
      </header>
      <div className="b-split">
        <div className="b-ledger" role="table" aria-label="Patients">
          <div className="b-lrow b-lhead" role="row">
            <span role="columnheader">Patient</span><span role="columnheader">Drug and dose</span><span role="columnheader">Week</span><span role="columnheader">Next action</span><span role="columnheader">Due</span>
          </div>
          {desk.groups.map((g) => (
            <div key={g.key} role="rowgroup">
              <div className={`b-lgroup ${g.key}`} role="row"><span role="cell">{g.label}</span><span role="cell">{g.hint}</span></div>
              {g.rows.map((x) => {
                const a = x.analysis;
                const prod = data.products[x.product];
                return (
                  <button key={x.id} role="row" className={`b-lrow ${a.priority}${desk.sel === x.id ? ' on' : ''}${desk.done[x.id] ? ' done' : ''}`} onClick={() => { desk.open(x.id); if (!isPhone()) window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={desk.sel === x.id}>
                    <span role="cell" className="b-lname">{x.name}</span>
                    <span role="cell" className="b-ldrug">{prod.brand} {a.current}&nbsp;mg</span>
                    <span role="cell"><WeekBar week={a.week} /></span>
                    <span role="cell" className="b-lact">{a.action.title}</span>
                    <span role="cell" className={a.action.by != null && a.action.by <= 0 ? 'b-ldue now' : 'b-ldue'}>{a.action.by == null ? '' : desk.done[x.id] ? 'Done' : a.action.by <= 0 ? 'Today' : dateLabel(a.action.by)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <Panel key={desk.p.id} p={desk.p} data={data} desk={desk} />
      </div>
    </div>
  );
}

export default function DirectionB({ data, tab, patient, go }) {
  useEffect(() => { loadFonts('b'); document.documentElement.classList.add('dir-b'); }, []);
  return (
    <div className="dB">
      <Bar tab={tab} store={data.store} />
      <main key={tab}>
        {tab === 'why' && <Insight data={data} go={go} />}
        {tab === 'desk' && <Desk data={data} initial={patient} />}
        {tab === 'plans' && <div className="b-carry"><Plans /></div>}
        {tab === 'pilot' && <div className="b-carry"><Pilot /></div>}
      </main>
      <footer className="b-foot">
        <span>Synthetic patients. Dose rules from the FDA labels for Wegovy, Ozempic, Zepbound and Mounjaro. Every dose decision goes to the prescriber.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
