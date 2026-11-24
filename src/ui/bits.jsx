import React from 'react';
import { dateLabel } from './format.js';

export function Chip({ tone = 'plain', children }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

export function Cite({ c }) {
  if (!c) return null;
  const text = `${c.title}${c.section ? `, section ${c.section}` : ''}`;
  return c.url ? <a className="cite" href={c.url} target="_blank" rel="noreferrer">{text}</a> : <span className="cite">{text}</span>;
}

// The first 12 weeks: each fill as a bar at its strength's height on the label's ladder,
// gaps in brick, today's line, and where the next step falls due.
export function Ladder({ p, product, a }) {
  const steps = product.steps.filter((s) => p.target == null || s <= Math.max(p.target, a.current));
  const W = 760;
  const rowH = 30;
  const H = steps.length * rowH;
  const top = 8;
  const left = 64;
  const span = 84;
  const x = (d) => left + ((d - p.startDay) / span) * (W - left - 8);
  const y = (s) => top + (steps.length - 1 - steps.indexOf(s)) * rowH;
  const fills = [...p.fills].sort((m, n) => m.day - n.day);
  let through = p.startDay - 1;
  const bars = fills.map((f) => {
    const from = Math.max(f.day, through + 1);
    through = from + f.ds - 1;
    return { from, to: through, s: f.strength };
  });
  const clip = (d) => Math.max(p.startDay, Math.min(p.startDay + span, d));
  const today = 0;
  const gapFrom = through + 1;
  return (
    <figure className="ladderwrap">
      <svg className="ladder" viewBox={`0 0 ${W} ${H + top + 26}`} role="img" aria-label={`Dose by week. Now ${a.current} mg in week ${a.week}.`}>
        {steps.map((s) => (
          <g key={s}>
            <line x1={left} x2={W - 8} y1={y(s) + rowH / 2} y2={y(s) + rowH / 2} className="lrail" />
            <text x={left - 10} y={y(s) + rowH / 2 + 4} className="lstep" textAnchor="end">{s} mg</text>
          </g>
        ))}
        {[0, 4, 8, 12].map((w) => (
          <g key={w}>
            <line x1={x(p.startDay + w * 7)} x2={x(p.startDay + w * 7)} y1={top} y2={H + top} className="lweek" />
            <text x={x(p.startDay + w * 7) + (w === 12 ? -3 : 3)} y={H + top + 18} className="lwk" textAnchor={w === 12 ? "end" : "start"}>{w === 0 ? 'Start' : `Wk ${w}`}</text>
          </g>
        ))}
        {bars.filter((b) => b.from <= p.startDay + span).map((b) => (
          <rect key={b.from} x={x(clip(b.from))} y={y(b.s) + 6} width={Math.max(2, x(clip(b.to + 1)) - x(clip(b.from)) - 2)} height={rowH - 12} rx="4" className="lfill" />
        ))}
        {gapFrom < today && <rect x={x(clip(gapFrom))} y={top} width={Math.max(2, x(clip(today)) - x(clip(gapFrom)))} height={H} className="lgap" />}
        {a.stepDueDay != null && a.next != null && a.stepDueDay <= p.startDay + span && (
          <g>
            <rect x={x(clip(a.stepDueDay))} y={y(a.next) + 6} width="40" height={rowH - 12} rx="4" className="lnext" />
          </g>
        )}
        <line x1={x(clip(today))} x2={x(clip(today))} y1={top - 4} y2={H + top + 4} className="ltoday" />
      </svg>
      <figcaption className="legend">
        <span><i className="k kcov" />supplied</span>
        <span><i className="k knext" />next step{a.stepDueDay != null && a.next != null ? `, due ${dateLabel(a.stepDueDay)}` : ''}</span>
        <span><i className="k kgap" />no supply</span>
        <span><i className="k ktoday" />today</span>
      </figcaption>
    </figure>
  );
}
