// Today's work list: every patient in their first 12 weeks, and one patient's next action.
import React from 'react';
import { Ladder, MiniLadder, Cite } from './bits.jsx';
import { dateLabel, COVERAGE, USE, PRIORITY } from './format.js';
import { useDesk, detailOf, headline, isPhone } from './deskState.js';

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
        <p className="a-note">{d.ladderFoot} <Cite c={d.schedule} />. {d.missedRule} <Cite c={d.missedCite} /></p>
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

export default function Today({ data, initial }) {
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
