// The work list's state and everything one patient's detail shows, as plain values.
import { useEffect, useState } from 'react';
import { BREAKS, breakOf, EFFECT_LABEL, FLAGS } from '../engine/desk.js';
import { script } from './content.js';
import { dateLabel, dayName, KIND, PRIORITY } from './format.js';

export const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

// Each patient's next break and the day it hits.
export function breakPoints(data) {
  return data.order.map((id) => data.patients[id]).map((p) => ({ p, b: breakOf(p.analysis, 0) })).filter((x) => x.b);
}
export const BREAK_LANES = BREAKS;

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// The work list's state: filter, selection, done marks and the phone sheet.
export function useDesk(data, initial) {
  const [filter, setFilter] = useState('all');
  const [done, setDone] = useState({});
  const all = data.order.map((id) => data.patients[id]);
  const counts = Object.fromEntries(PRIORITY.map((g) => [g.key, all.filter((x) => x.analysis.priority === g.key).length]));
  const groups = PRIORITY.filter((g) => filter === 'all' || filter === g.key).map((g) => ({ ...g, rows: all.filter((x) => x.analysis.priority === g.key) }));
  const visible = groups.flatMap((g) => g.rows);
  const [sel, setSel] = useState(initial && data.patients[initial] ? initial : all[0].id);
  const [sheet, setSheet] = useState(!!(initial && data.patients[initial]));
  useEffect(() => { if (!visible.some((x) => x.id === sel)) setSel(visible[0]?.id); }, [filter]);
  useEffect(() => { document.body.style.overflow = sheet && isPhone() ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [sheet]);
  const left = all.filter((x) => x.analysis.priority === 'now' && !done[x.id]).length;
  const open = (id) => { setSel(id); setSheet(true); };
  return { all, counts, groups, filter, setFilter, done, markDone: (id) => setDone({ ...done, [id]: now() }), sel, open, sheet, close: () => setSheet(false), left, p: data.patients[sel] };
}

export const headline = (left) => (left ? `${left} ${left === 1 ? 'thing cannot' : 'things cannot'} wait today` : 'Everything urgent is done');

// Everything the detail pane shows for one patient, as plain values.
export function detailOf(p, data, done) {
  const a = p.analysis;
  const prod = data.products[p.product];
  const k = KIND[a.action.kind];
  const lines = [...script(p, a, prod), ...a.say].filter(Boolean);
  const verb = a.action.kind === 'fax' ? 'Send fax' : a.action.kind === 'hold' ? 'Patient and prescriber reached' : 'Mark called';
  const sayLabel = a.action.kind === 'hold' ? 'Call the patient first' : a.action.kind === 'fax' ? 'Then tell the patient' : 'What to say';
  const when = a.action.by == null ? null : a.action.by <= 0 ? 'Today' : `By ${dayName(a.action.by)}`;
  const quiet = a.action.kind === 'none' && lines.length === 0 ? `The desk looks again on ${dateLabel(Math.max(1, (a.stepDueDay ?? a.nextFillDay) - 3))}, three days before the next fill.` : null;
  const plain = (r) => r.effects.filter((e) => !FLAGS.includes(e.key));
  const faxRefs = `Days covered since the first fill: ${a.coverage.covered} of ${a.coverage.elapsed}.${a.coverage.gapDays > 0 ? ` No supply for the last ${a.coverage.gapDays} days.` : ''} Last side-effect check: ${a.lastReport ? `${dateLabel(a.lastReport.day)}, ${plain(a.lastReport).length ? plain(a.lastReport).map((e) => `${EFFECT_LABEL[e.key].toLowerCase()} (${e.level})`).join(', ') : 'none reported'}` : 'none yet'}.`;
  const fax = a.action.kind === 'fax' ? {
    to: `${p.prescriber.name}, ${p.prescriber.practice}`,
    from: `Pharmacist, ${data.store.name} (synthetic)`,
    re: `${p.name}, ${p.age}. ${prod.brand} ${a.current} mg weekly, week ${a.week}`,
    ask: a.action.ask,
    reply: a.action.reply || ['Agree, prescription sent', 'Keep current dose', 'Call me'],
    refs: faxRefs,
  } : null;
  // Side effects
  const r = a.report;
  const tol = a.tolerability;
  const effects = r ? plain(r) : [];
  const flags = r ? r.effects.filter((e) => FLAGS.includes(e.key)) : [];
  const effTone = !r ? 'plain' : { hold: 'stop', 'other-drug': 'stop', slow: 'step', lower: 'step', reassess: 'step', continue: 'ok' }[tol.call];
  const effLabel = !r ? 'No report yet' : { hold: 'Hold', 'other-drug': 'Ask about the other drug', slow: 'Slow down', lower: 'Lower maintenance', reassess: 'Reassess', continue: 'Continue' }[tol.call];
  const effNote = `${r && (effects.length || flags.length) ? `Reported ${dateLabel(r.day)}. ${tol.why} ` : r ? '' : 'The first check-in records any side effects. '}Every dose decision goes to the prescriber.`;
  const effNone = r && !effects.length && !flags.length ? `None reported on ${dateLabel(r.day)}.` : null;
  // Next fill
  const held = a.action.kind === 'hold';
  const late = a.coverage.gapDays > 0;
  const fill = held
    ? { title: 'Next fill', when: 'On hold', lines: [{ tone: 'stop', text: 'No fill until the prescriber decides.' }] }
    : {
      title: late ? 'Supply' : 'Before the next fill',
      when: late ? `ran out ${dateLabel(a.nextFillDay)}` : dateLabel(a.nextFillDay),
      lines: [
        ...(late ? [{ tone: 'stop', text: `No supply for ${a.coverage.gapDays} days, ${a.missedDoses} weekly ${a.missedDoses === 1 ? 'dose' : 'doses'} missed.` }] : []),
        ...(a.blockers.length ? a.blockers.map((b) => ({ tone: b.key === 'bridge' || b.key === 'card' ? 'step' : 'info', text: b.label }))
          : late ? [] : [{ tone: 'ok', text: `Prescription on file${p.pa ? ', approval covers it' : ''}${p.card ? ', savings card active' : ''}. Nothing blocking.` }]),
      ],
    };
  const ladderFoot = `Label steps ${prod.steps.join(', ')} mg, at least 4 weeks each. Prescriber's target ${p.target} mg. ${prod.missedRule}`;
  return {
    a, prod, k, lines, verb, sayLabel, when, quiet, fax, isDone: !!done[p.id], doneAt: done[p.id],
    effects: { tone: effTone, label: effLabel, flags: flags.map((e) => EFFECT_LABEL[e.key]), list: effects.map((e) => ({ key: e.key, label: EFFECT_LABEL[e.key], level: e.level })), note: effNote, none: effNone },
    fill, ladderFoot, ladderHeld: held || a.action.type === 'restart', cite: a.action.cite, schedule: prod.schedule,
  };
}

export const TABS = [
  { key: 'why', label: 'Insight' },
  { key: 'desk', label: 'Work list' },
  { key: 'plans', label: 'For plans' },
  { key: 'pilot', label: 'Pilot' },
];
