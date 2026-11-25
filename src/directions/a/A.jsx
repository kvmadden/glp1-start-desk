// Direction A, "Broadsheet". A newspaper graphics desk treatment: serif headlines, annotated
// charts with direct labels, hairline rules instead of boxes, claret for money, ochre for supply.
import React, { useEffect, useState } from 'react';
import { REASONS, REASONS_SOURCE, SEES, SEES_NOTE, WHO } from '../../ui/Insight.jsx';
import { Ladder, MiniLadder, Cite } from '../../ui/bits.jsx';
import { dateLabel, firstName, COVERAGE, USE, PRIORITY } from '../../ui/format.js';
import Plans from '../../ui/Plans.jsx';
import Pilot from '../../ui/Pilot.jsx';
import { useNarrow } from '../../ui/bits.jsx';
import { breakPoints, BREAK_LANES, useDesk, detailOf, headline, isPhone, loadFonts, TABS } from '../shared.jsx';
import './a.css';

function Masthead({ tab, store }) {
  return (
    <header className="a-mast">
      <div className="a-mast-in">
        <a className="a-title" href="#/why">GLP-1 Start Desk</a>
        <nav className="a-nav" aria-label="Sections">
          {TABS.map((t) => <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}>{t.label}</a>)}
        </nav>
        <span className="a-dateline">{store.name}, synthetic patients, {dateLabel(0)}, 2026</span>
      </div>
    </header>
  );
}

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
                <circle cx={cx} cy={yOf(i)} r={22} className="hit" />
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

function Insight({ data, go }) {
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

function Detail({ p, data, desk }) {
  const d = detailOf(p, data, desk.done);
  const a = d.a;
  return (
    <article className={desk.sheet ? 'a-detail open' : 'a-detail'} aria-live="polite">
      <button className="a-back" onClick={desk.close}>← All patients</button>
      <p className="a-who"><strong>{p.name}</strong>, {p.age}. {p.uses.map((u) => USE[u]).join(', ')}. {COVERAGE[p.coverage]}. {p.prescriber.name}, {p.prescriber.practice}</p>
      <p className={`a-kicker ${d.k.tone}`}>{d.k.label}{d.when ? `, ${d.when.toLowerCase()}` : ''}</p>
      <h2 className="a-dtitle">{a.action.title}</h2>
      <p className="a-stand">{a.action.why}</p>
      {d.fax && (
        <div className="a-faxwrap">
          <div className={d.isDone ? 'a-fax gone' : 'a-fax'}>
            <div className="a-faxtop"><span>FAX</span><span>Page 1 of 1</span></div>
            <dl>
              <dt>To</dt><dd>{d.fax.to}</dd>
              <dt>From</dt><dd>{d.fax.from}</dd>
              <dt>Re</dt><dd>{d.fax.re}</dd>
            </dl>
            <p className="a-ask">{d.fax.ask}</p>
            <p className="a-reply">{d.fax.reply.map((r) => <span key={r}>[ ] {r}</span>)}</p>
            <p className="a-refs">{d.fax.refs}</p>
          </div>
          {d.isDone && <span className="a-stamp">SENT {d.doneAt}</span>}
        </div>
      )}
      {d.lines.length > 0 && (
        <div className="a-say">
          <p className="a-label">{d.sayLabel}</p>
          <ol>{d.lines.map((l) => <li key={l}>{l}</li>)}</ol>
        </div>
      )}
      {d.quiet && <p className="a-note">{d.quiet}</p>}
      <div className="a-act">
        {a.action.kind !== 'none' && (d.isDone ? <span className="a-done">✓ Done at {d.doneAt}</span> : <button className="a-btn" onClick={() => desk.markDone(p.id)}>{d.verb}</button>)}
        <span className="a-note">Rule: <Cite c={d.cite} /></span>
      </div>
      <section className="a-block">
        <header><h3>{d.prod.brand}, week {a.week} of 12</h3><span>{a.coverage.covered} of {a.coverage.elapsed} days covered</span></header>
        <Ladder p={p} product={d.prod} a={a} held={d.ladderHeld} />
        <p className="a-note">{d.ladderFoot} <Cite c={d.schedule} /></p>
      </section>
      <div className="a-two">
        <section className="a-block">
          <header><h3>Side effects</h3><span className={`a-tag ${d.effects.tone}`}>{d.effects.label}</span></header>
          {d.effects.flags.length > 0 && <ul className="a-lines">{d.effects.flags.map((f) => <li key={f} className="stop">{f}</li>)}</ul>}
          {d.effects.list.length > 0 && <ul className="a-lines">{d.effects.list.map((e) => <li key={e.key}><span>{e.label}</span><span className="a-lvl">{e.level}</span></li>)}</ul>}
          {d.effects.none && <p>{d.effects.none}</p>}
          <p className="a-note">{d.effects.note}</p>
        </section>
        <section className="a-block">
          <header><h3>{d.fill.title}</h3><span>{d.fill.when}</span></header>
          <ul className="a-lines">{d.fill.lines.map((l) => <li key={l.text} className={l.tone}>{l.text}</li>)}</ul>
        </section>
      </div>
    </article>
  );
}

function Desk({ data, initial }) {
  const desk = useDesk(data, initial);
  const total = desk.all.length;
  return (
    <div className="a-desk">
      <header className="a-deskhead">
        <div>
          <h1>{headline(desk.left)}</h1>
          <p className="a-stand">{total} patients in their first 12 weeks. Holds first, then by the last day each action still works.</p>
        </div>
        <div className="a-filter" role="radiogroup" aria-label="Show">
          {[{ key: 'all', label: 'All', n: total }, ...PRIORITY.map((g) => ({ key: g.key, label: g.label, n: desk.counts[g.key] }))].map((f) => (
            <button key={f.key} role="radio" aria-checked={desk.filter === f.key} className={desk.filter === f.key ? 'on' : ''} onClick={() => desk.setFilter(f.key)}>
              {f.key !== 'all' && <i className={`a-sq ${f.key}`} />}{f.label} <span>{f.n}</span>
            </button>
          ))}
        </div>
      </header>
      <div className="a-split">
        <div className="a-list">
          {desk.groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h4 className="a-grouphead"><span>{g.label}</span><span>{g.hint}</span></h4>
              <ol>
                {g.rows.map((x) => {
                  const a = x.analysis;
                  const prod = data.products[x.product];
                  return (
                    <li key={x.id}>
                      <button className={`a-row${desk.sel === x.id ? ' on' : ''}${desk.done[x.id] ? ' done' : ''}`} onClick={() => { desk.open(x.id); if (!isPhone()) window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={desk.sel === x.id}>
                        <span className="a-rowtop">
                          <strong>{x.name}</strong>
                          {a.action.by != null && <span className={`a-due ${a.priority}`}>{desk.done[x.id] ? 'done' : a.action.by <= 0 ? 'today' : dateLabel(a.action.by)}</span>}
                        </span>
                        <span className="a-rowmeta"><MiniLadder steps={prod.steps} current={a.current} next={a.next} target={x.target} />{prod.brand} {a.current}&nbsp;mg, week {a.week}</span>
                        <span className="a-rowact">{a.action.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <Detail key={desk.p.id} p={desk.p} data={data} desk={desk} />
      </div>
    </div>
  );
}

export default function DirectionA({ data, tab, patient, go }) {
  useEffect(() => { loadFonts('a'); document.documentElement.classList.add('dir-a'); }, []);
  return (
    <div className="dA">
      <Masthead tab={tab} store={data.store} />
      <main key={tab}>
        {tab === 'why' && <Insight data={data} go={go} />}
        {tab === 'desk' && <Desk data={data} initial={patient} />}
        {tab === 'plans' && <div className="a-carry"><Plans /></div>}
        {tab === 'pilot' && <div className="a-carry"><Pilot /></div>}
      </main>
      <footer className="a-foot">
        <span>Synthetic patients. Dose rules from the FDA labels for Wegovy, Ozempic, Zepbound and Mounjaro. Every dose decision goes to the prescriber.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
