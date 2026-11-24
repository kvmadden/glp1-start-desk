import React, { useEffect, useState } from 'react';

// True on phone widths, so charts can redraw at a size where their text stays readable.
export function useNarrow(px = 760) {
  const q = `(max-width: ${px}px)`;
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setN(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return n;
}
import { dateLabel } from './format.js';

export function Chip({ tone = 'plain', children }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

export function Cite({ c }) {
  if (!c) return null;
  const text = `${c.title}${c.section ? `, section ${c.section}` : ''}`;
  return c.url ? <a className="cite" href={c.url} target="_blank" rel="noreferrer">{text}</a> : <span className="cite">{text}</span>;
}

// The brand mark: four rising steps, the dose ladder.
export function BrandMark({ size = 28 }) {
  return (
    <svg className="brandmark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#0f5c4d" />
      <rect x="5" y="17" width="4" height="6" rx="1" fill="#9fd3c4" />
      <rect x="10" y="13" width="4" height="10" rx="1" fill="#c9e8de" />
      <rect x="15" y="9" width="4" height="14" rx="1" fill="#ffffff" />
      <rect x="20" y="5" width="4" height="18" rx="1" fill="none" stroke="#d4962f" strokeWidth="1.4" strokeDasharray="2 1.5" />
    </svg>
  );
}

// A row's dose ladder: one bar per step up to the prescriber's target. Filled up to today's
// strength, dashed for the next step.
export function MiniLadder({ steps, current, next, target }) {
  const shown = steps.filter((s) => s <= Math.max(target ?? s, current));
  const w = 7;
  const gap = 3;
  const H = 22;
  const i = shown.indexOf(current);
  return (
    <svg className="mini" width={shown.length * (w + gap)} height={H} aria-hidden="true">
      {shown.map((s, k) => {
        const h = 6 + ((H - 6) * (k + 1)) / shown.length;
        const cls = k <= i ? 'f' : s === next ? 't' : '';
        return <rect key={s} x={k * (w + gap) + 0.6} y={H - h + 0.6} width={w - 1.2} height={h - 1.2} rx="1.5" className={cls} />;
      })}
    </svg>
  );
}

// The first 12 weeks: each fill as a bar at its strength on the label's ladder, gaps in coral,
// today's line, and where the next step falls due.
export function Ladder({ p, product, a, held }) {
  const steps = product.steps.filter((s) => p.target == null || s <= Math.max(p.target, a.current));
  const narrow = useNarrow();
  const W = narrow ? 360 : 760;
  const rowH = narrow ? 28 : 32;
  const H = steps.length * rowH;
  const top = 18;
  const left = narrow ? 62 : 68;
  const span = 84;
  const x = (d) => left + ((d - p.startDay) / span) * (W - left - 12);
  const y = (s) => top + (steps.length - 1 - steps.indexOf(s)) * rowH;
  const fills = [...p.fills].sort((m, n) => m.day - n.day);
  let through = p.startDay - 1;
  const bars = fills.map((f) => {
    const from = Math.max(f.day, through + 1);
    through = from + f.ds - 1;
    return { from, to: through, s: f.strength };
  });
  const clip = (d) => Math.max(p.startDay, Math.min(p.startDay + span, d));
  const gapFrom = through + 1;
  const showNext = !held && a.stepDueDay != null && a.next != null && a.stepDueDay <= p.startDay + span;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="ladder" viewBox={`0 0 ${W} ${H + top + 26}`} role="img" aria-label={`Dose by week. Now ${a.current}\u00a0mg in week ${a.week}.`}>
        {steps.map((s) => (
          <g key={s}>
            <line x1={left} x2={W - 12} y1={y(s) + rowH / 2} y2={y(s) + rowH / 2} className="lrail" />
            <text x={left - 12} y={y(s) + rowH / 2 + 4} className={s === a.current ? 'lstep cur' : 'lstep'} textAnchor="end">{s}&nbsp;mg</text>
          </g>
        ))}
        {[0, 4, 8, 12].map((w) => (
          <g key={w}>
            <line x1={x(p.startDay + w * 7)} x2={x(p.startDay + w * 7)} y1={top} y2={H + top} className="lweek" />
            <text x={x(p.startDay + w * 7) + (w === 12 ? -4 : 4)} y={H + top + 20} className="lwk" textAnchor={w === 12 ? 'end' : 'start'}>{w === 0 ? 'Start' : narrow ? `Wk ${w}` : `Week ${w}`}</text>
          </g>
        ))}
        {gapFrom < 0 && <rect x={x(clip(gapFrom))} y={top} width={Math.max(2, x(clip(0)) - x(clip(gapFrom)))} height={H} className="lgap" />}
        {bars.filter((b) => b.from <= p.startDay + span).map((b, k) => (
          <rect key={b.from} x={x(clip(b.from))} y={y(b.s) + 7} width={Math.max(2, x(clip(b.to + 1)) - x(clip(b.from)) - 2)} height={rowH - 14} rx="5" className="lfill" style={{ animationDelay: `${k * 120}ms` }} />
        ))}
        {showNext && <rect x={x(clip(a.stepDueDay))} y={y(a.next) + 7} width={Math.min(x(clip(a.stepDueDay + 27)), W - 12) - x(clip(a.stepDueDay))} height={rowH - 14} rx="5" className="lnext" />}
        <line x1={x(clip(0))} x2={x(clip(0))} y1={top - 4} y2={H + top + 2} className="ltoday" />
        <text x={x(clip(0))} y={top - 7} className="ltodayl" textAnchor="middle">Today</text>
      </svg>
      <figcaption className="legend">
        <span><i className="k kcov" />supplied</span>
        {showNext && <span><i className="k knext" />next step, due {dateLabel(a.stepDueDay)}</span>}
        {gapFrom < 0 && <span><i className="k kgap" />no supply</span>}
      </figcaption>
    </figure>
  );
}
