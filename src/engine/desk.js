// The desk's rules. One patient in, one read of where they stand and one next action out.
// Every decision carries the rule it came from. The pharmacist never changes a dose: every dose
// decision is a request to the prescriber, and a hold means "do not take the next dose until the
// prescriber says so".
import { PRODUCTS, nextStep, weekOf } from './labels.js';
import { cite } from './sources.js';

export const WINDOW_WEEKS = 12;
// Planning rule, not a measured number: a prescriber answers a fax within 2 business days,
// so a request has to leave 3 calendar days before the supply runs out.
export const FAX_LEAD_DAYS = 3;
// Pharmacist practice: check in a few days after each new strength, when stomach effects tend to show.
export const CHECKIN_AFTER_STEP_DAYS = 3;

const GI = ['nausea', 'vomiting', 'diarrhea', 'constipation', 'reflux'];
// Facts the patient tells us that are not side effects and carry no severity.
export const FLAGS = ['thyroid-history', 'pregnant', 'procedure'];
const LEVEL = { mild: 1, moderate: 2, severe: 3 };

export const EFFECT_LABEL = {
  nausea: 'Nausea',
  vomiting: 'Vomiting',
  diarrhea: 'Diarrhea',
  constipation: 'Constipation',
  reflux: 'Heartburn',
  'abdominal-pain-severe': 'Severe belly pain that will not let up, may go to the back',
  'ruq-pain': 'Pain under the right ribs with fever or yellow skin',
  dehydration: 'Cannot keep fluids down, dizzy when standing',
  'low-sugar': 'Low blood sugar readings or symptoms',
  pregnant: 'Pregnant or planning pregnancy',
  'thyroid-history': 'Family history of medullary thyroid cancer',
  procedure: 'Surgery or procedure with sedation coming up',
};

// Supply from fills. Same-drug fills that overlap carry forward, the way a pen box sits on the shelf.
export function coverage(fills, startDay, today) {
  let through = startDay - 1;
  const segments = [];
  for (const f of [...fills].sort((a, b) => a.day - b.day)) {
    const from = Math.max(f.day, through + 1);
    const to = from + f.ds - 1;
    const last = segments[segments.length - 1];
    if (last && last[1] === from - 1) last[1] = to;
    else segments.push([from, to]);
    through = to;
  }
  const windowEnd = startDay + WINDOW_WEEKS * 7 - 1;
  const upTo = Math.min(today - 1, windowEnd);
  let covered = 0;
  for (const [a, b] of segments) covered += Math.max(0, Math.min(b, upTo) - Math.max(a, startDay) + 1);
  const elapsed = Math.max(0, upTo - startDay + 1);
  return { segments, through, covered, elapsed, gapDays: Math.max(0, today - 1 - through) };
}

function latestReport(p, today) {
  const recent = (p.reports || []).filter((r) => r.day <= today && today - r.day <= 10);
  return recent.sort((a, b) => b.day - a.day)[0] || null;
}

// The tolerability read: hold, slow down, ask about the other drug, or continue.
export function tolerability(p, report, ctx) {
  const prod = PRODUCTS[p.product];
  const effects = report?.effects || [];
  const has = (k) => effects.some((e) => e.key === k);
  if (has('abdominal-pain-severe')) {
    return { call: 'hold', why: 'Possible pancreatitis. The label says to stop if pancreatitis is suspected.', cite: prod.cite.warnings, care: 'Please go to urgent care or the emergency department today.' };
  }
  if (has('ruq-pain')) {
    return { call: 'hold', why: 'Possible gallbladder disease. The label calls for gallbladder studies and follow-up.', cite: prod.cite.warnings, care: 'Please get seen today by your prescriber or at urgent care.' };
  }
  if (has('dehydration')) {
    return { call: 'hold', why: 'Fluid loss from vomiting or diarrhea can hurt the kidneys. The label says to monitor kidney function.', cite: prod.cite.warnings, care: 'Keep sipping fluids. If you cannot keep anything down or feel confused, go to urgent care today.' };
  }
  if (has('thyroid-history')) {
    return { call: 'hold', why: 'A personal or family history of medullary thyroid cancer or MEN 2 is a contraindication.', cite: prod.cite.boxed, care: 'Your prescriber will decide on another option with you.' };
  }
  if (has('pregnant')) {
    return { call: 'hold', why: prod.pregnancy, cite: prod.cite.pregnancy, care: 'Your prescriber will decide the next step with you.' };
  }
  if (has('low-sugar') && p.meds?.some((m) => m === 'insulin' || m === 'sulfonylurea')) {
    return { call: 'other-drug', why: 'Low sugars on insulin or a sulfonylurea. The label says to consider lowering that drug.', cite: prod.cite.warnings };
  }
  const gi = effects.filter((e) => GI.includes(e.key));
  const worst = Math.max(0, ...gi.map((e) => LEVEL[e.level]));
  if (worst >= 2) {
    if (ctx.atMaintenance) {
      const lowerExists = prod.maintenance.some((m) => m < ctx.current);
      if (!lowerExists) {
        return { call: 'reassess', why: `Not tolerating ${ctx.current}\u00a0mg, which is already the lowest maintenance dose on the label. The prescriber decides whether to continue.`, cite: prod.cite.tolerate };
      }
      return prod.lowerMaintenanceIfNotTolerated
        ? { call: 'lower', why: 'Not tolerating the maintenance dose. The label says to consider a lower maintenance dose.', cite: prod.cite.tolerate }
        : { call: 'slow', why: 'Not tolerating this dose. Ask the prescriber whether to stay or step back.', cite: prod.cite.tolerate };
    }
    return {
      call: 'slow',
      why: prod.delayIfNotTolerated
        ? 'Not tolerating this step. The label says to consider delaying the next step for 4 weeks.'
        : 'Not tolerating this step. Each step is allowed after at least 4 weeks, so staying longer is within the label.',
      cite: prod.cite.tolerate,
    };
  }
  if (worst === 1) return { call: 'continue', why: 'Mild stomach effects. Continue with self-care.', cite: prod.cite.warnings, selfCare: true };
  return { call: 'continue', why: report ? 'No side effects reported.' : 'No check-in yet.', cite: null };
}

// Everything the desk knows about one patient today.
export function analyze(p, today) {
  const prod = PRODUCTS[p.product];
  if (!prod) throw new Error(`unknown product ${p.product}`);
  const fills = [...p.fills].sort((a, b) => a.day - b.day);
  const cov = coverage(fills, p.startDay, today);
  const current = fills[fills.length - 1].strength;
  const firstAtCurrent = fills.find((f) => f.strength === current).day;
  const week = weekOf(p.startDay, today);
  const atMaintenance = prod.maintenance.includes(current) && (p.target == null || current >= p.target);
  const next = atMaintenance ? null : nextStep(p.product, current, p.target);
  // The step falls due when the current strength's supply runs out (4 weekly doses per box),
  // and never earlier than the label's 4 weeks on the current dose.
  const stepDueDay = next ? Math.max(firstAtCurrent + prod.weeksPerStep * 7, cov.through + 1) : null;
  const nextFillDay = cov.through + 1;
  const nextStrength = next || current;
  const rxFor = (s) => (p.rx || []).find((r) => r.strength === s && r.fillsLeft > 0);
  const report = latestReport(p, today);
  const lastReport = [...(p.reports || [])].filter((r) => r.day <= today).sort((a, b) => b.day - a.day)[0] || null;
  const tol = tolerability(p, report, { atMaintenance, current });
  // Weekly doses that fell due with no supply: the first the day after the supply ran out, then every 7 days.
  const missedDoses = cov.gapDays > 0 ? Math.floor((cov.gapDays - 1) / 7) + 1 : 0;
  const stepJustHappened = fills.length > 1 && fills[fills.length - 2].strength !== current && today - firstAtCurrent <= 7;

  // Blockers between today and the next fill.
  const blockers = [];
  const want = tol.call === 'slow' ? current : nextStrength;
  if (!rxFor(want)) blockers.push({ key: 'no-rx', label: `No prescription on file for ${want}\u00a0mg`, cite: prod.cite.schedule });
  if (p.pa && (!p.pa.strengths.includes(want) || p.pa.through < nextFillDay)) {
    blockers.push({ key: 'pa', label: p.pa.through < nextFillDay ? `Prior authorization ends before the next fill` : `Prior authorization covers ${p.pa.strengths.join(' and ')}\u00a0mg only`, cite: cite('practice') });
  }
  if (p.card && p.card.through < nextFillDay) blockers.push({ key: 'card', label: `Savings card ends before the next fill. Copay without it: $${p.card.copayWithout}`, cite: cite('practice') });
  if (p.stock?.[want] === 'out') blockers.push({ key: 'stock', label: `${want}\u00a0mg out of stock at this store`, cite: cite('practice') });
  if (p.coverage === 'medicare' && p.uses.every((u) => u === 'weight')) {
    blockers.push({ key: 'bridge', label: 'Medicare Part D excludes drugs used for weight loss alone. Check the Medicare GLP-1 Bridge', cite: cite('partdExclusion') });
  }

  const say = [];
  if (tol.selfCare) say.push('Eat smaller meals, stop when full, go easy on fried and fatty food, and sip fluids through the day.');
  const ocWeeks = prod.oralContraceptiveWeeks;
  if (ocWeeks && p.meds?.includes('oral-contraceptive') && (week <= 4 || (stepDueDay && stepDueDay - today <= 7) || stepJustHappened)) {
    say.push(`Birth control pills may work less well. Use a non-oral method or add a barrier method for ${ocWeeks} weeks after starting and after each new dose.`);
  }


  const action = chooseAction({ p, prod, today, cov, current, next, stepDueDay, nextFillDay, tol, blockers, missedDoses, report, firstAtCurrent, stepJustHappened, rxFor, week });
  return {
    id: p.id, week, current, next, atMaintenance, stepDueDay, nextFillDay, firstAtCurrent,
    coverage: cov, missedDoses, report, lastReport, tolerability: tol, blockers, say, action,
  };
}

// One next action, most urgent first. `by` is the last day it can happen and still work.
function chooseAction(c) {
  const { p, prod, today, cov, current, next, stepDueDay, nextFillDay, tol, blockers, missedDoses, report, stepJustHappened, firstAtCurrent } = c;
  const has = (k) => blockers.some((b) => b.key === k);
  if (tol.call === 'hold') {
    return { kind: 'hold', title: 'Hold the next dose, call the prescriber today', by: today, why: tol.why, care: tol.care, cite: tol.cite };
  }
  if (tol.call === 'other-drug') {
    return { kind: 'fax', type: 'other-drug', title: `Ask about lowering the ${p.meds.includes('insulin') ? 'insulin' : 'sulfonylurea'}`, by: today, why: tol.why, cite: tol.cite, ask: (() => { const d = p.meds.filter((m) => m === 'insulin' || m === 'sulfonylurea').join(' and '); return `Low blood sugars reported on ${prod.brand} ${current}\u00a0mg with ${d}. The label says to consider lowering the ${d} dose. Please advise.`; })(), reply: ['Will lower the dose', 'Keep as is', 'Call me'] };
  }
  if (missedDoses >= 2) {
    const labelRestart = prod.restartAfterMissed != null && missedDoses >= prod.restartAfterMissed;
    const lower = prod.steps[Math.max(0, prod.steps.indexOf(current) - 1)];
    return {
      kind: 'fax', type: 'restart', title: `Ask which dose to restart at after ${missedDoses} missed weeks`, by: today,
      why: labelRestart
        ? `${missedDoses} weekly doses without supply. The label says to restart the escalation at a lower dose after 2 or more missed doses.`
        : `${missedDoses} weekly doses without supply. The ${prod.brand} label gives no restart rule, so the prescriber decides.`,
      cite: prod.cite.missed,
      ask: labelRestart
        ? `No supply for ${missedDoses} weeks. The label says to restart at a lower dose. Please send a prescription for ${lower}\u00a0mg, or the dose you prefer.`
        : `No supply for ${missedDoses} weeks on ${current}\u00a0mg. Please confirm whether to restart at ${current}\u00a0mg or at ${lower}\u00a0mg.`,
    };
  }
  if (tol.call === 'reassess') {
    return { kind: 'fax', type: 'reassess', title: `Ask the prescriber to reassess ${current}\u00a0mg`, by: Math.max(today, nextFillDay - FAX_LEAD_DAYS), why: tol.why, cite: tol.cite, ask: `Moderate side effects on ${prod.brand} ${current}\u00a0mg, the lowest maintenance dose on the label. Please advise whether to continue, pause or stop.`, reply: ['Continue', 'Pause', 'Call me'] };
  }
  if (tol.call === 'slow' || tol.call === 'lower') {
    const back = prod.steps[Math.max(0, prod.steps.indexOf(current) - 1)];
    const ask = tol.call === 'lower'
      ? `Not tolerating ${current}\u00a0mg. The label says to consider a lower maintenance dose. Please send a prescription for the dose you prefer.`
      : `Moderate stomach effects on ${current}\u00a0mg. Please consider keeping ${current}\u00a0mg for 4 more weeks before the next step${c.rxFor(current) ? '' : `, and send a prescription for ${current}\u00a0mg`}.`;
    return { kind: 'fax', type: tol.call, title: tol.call === 'lower' ? `Ask about a lower maintenance dose than ${current}\u00a0mg` : `Ask to stay on ${current}\u00a0mg for 4 more weeks`, by: Math.max(today, nextFillDay - FAX_LEAD_DAYS), why: tol.why, cite: tol.cite, ask, back };
  }
  if (next && has('no-rx')) {
    return { kind: 'fax', type: 'step', title: `Request the ${next}\u00a0mg prescription`, by: Math.max(today, stepDueDay - FAX_LEAD_DAYS), why: `Week ${Math.floor((stepDueDay - p.startDay) / 7) + 1} step to ${next}\u00a0mg is due ${stepDueDay - today <= 0 ? 'now' : `in ${stepDueDay - today} days`}, and a new strength needs its own prescription.`, cite: prod.cite.schedule, ask: `${prod.brand} ${current}\u00a0mg runs out ${stepDueDay - today <= 0 ? 'now' : `in ${stepDueDay - today} days`}. Per the label schedule the next step is ${next}\u00a0mg weekly. Please send a prescription for ${next}\u00a0mg if you agree, or tell us to keep ${current}\u00a0mg.` };
  }
  if (!next && has('no-rx')) {
    return { kind: 'fax', type: 'renew', title: `Request a refill for ${current}\u00a0mg`, by: Math.max(today, nextFillDay - FAX_LEAD_DAYS), why: 'No refills left on the current strength.', cite: prod.cite.schedule, ask: `No refills left on ${prod.brand} ${current}\u00a0mg. Please send a new prescription if therapy continues.` };
  }
  if (has('pa')) {
    return { kind: 'fax', type: 'pa', title: 'Ask the prescriber to update the prior authorization', by: Math.max(today, nextFillDay - FAX_LEAD_DAYS - 2), why: blockers.find((b) => b.key === 'pa').label, cite: cite('practice'), ask: `The plan's approval for ${prod.brand} does not cover the next fill (${next || current}\u00a0mg). Please submit an updated prior authorization.` };
  }
  if (has('bridge')) {
    return { kind: 'call', type: 'bridge', title: 'Call about Medicare coverage', by: Math.max(today, nextFillDay - 5), why: 'Weight-only use is excluded from Part D. The Medicare GLP-1 Bridge runs July 1, 2026 to December 31, 2027 with a $50 copay for those who qualify.', cite: cite('bridge') };
  }
  if (has('card')) {
    return { kind: 'call', type: 'cost', title: 'Call about the copay before the card ends', by: Math.max(today, nextFillDay - 5), why: blockers.find((b) => b.key === 'card').label, cite: cite('practice') };
  }
  if (has('stock')) {
    return { kind: 'call', type: 'stock', title: `Order ${next || current}\u00a0mg and tell the patient when it lands`, by: Math.max(today, nextFillDay - 2), why: blockers.find((b) => b.key === 'stock').label, cite: cite('practice') };
  }
  if (report?.effects.some((e) => e.key === 'procedure')) {
    return { kind: 'call', type: 'procedure', title: 'Call before the procedure', by: today + 1, why: 'The drug slows stomach emptying, and the label reports aspiration under anesthesia or deep sedation. It tells patients to inform their care team before any planned procedure.', cite: prod.cite.warnings };
  }
  if (missedDoses === 1 || (nextFillDay - today <= 2 && !p.fills.some((f) => f.day > today))) {
    return { kind: 'call', type: 'refill', title: missedDoses === 1 ? 'Call: one dose late' : 'Call: supply ends in 2 days', by: today + (missedDoses === 1 ? 0 : 1), why: `${prod.brand} label: ${prod.missedRule}`, cite: prod.cite.missed };
  }
  if (stepJustHappened && today - firstAtCurrent >= CHECKIN_AFTER_STEP_DAYS - 1) {
    return { kind: 'call', type: 'checkin', title: `Check in on the new ${current}\u00a0mg dose`, by: firstAtCurrent + CHECKIN_AFTER_STEP_DAYS + 2, why: 'A few days after a new strength is when stomach effects show and people decide whether to keep going.', cite: cite('practice') };
  }
  if (!report && today - p.startDay >= CHECKIN_AFTER_STEP_DAYS - 1 && today - p.startDay <= 14) {
    return { kind: 'call', type: 'checkin', title: 'First-week check-in', by: p.startDay + CHECKIN_AFTER_STEP_DAYS + 2, why: 'The first dose week is when people decide whether this is for them.', cite: cite('practice') };
  }
  return { kind: 'none', title: next ? `On track. Step to ${next}\u00a0mg at the next fill` : `On track at ${current}\u00a0mg`, by: null, why: next ? 'Prescription on file and nothing blocking the next fill.' : 'At the target dose with nothing blocking the next fill.', cite: prod.cite.schedule };
}

// Today's list: actions that cannot wait first, then by last day to act.
const KIND_ORDER = { hold: 0, fax: 1, call: 2, none: 3 };
export function todayList(analyses, today) {
  return [...analyses].sort((a, b) => {
    const ua = a.action.by != null && a.action.by <= today ? 0 : 1;
    const ub = b.action.by != null && b.action.by <= today ? 0 : 1;
    return ua - ub || KIND_ORDER[a.action.kind] - KIND_ORDER[b.action.kind] || (a.action.by ?? 1e9) - (b.action.by ?? 1e9) || a.id.localeCompare(b.id);
  });
}

// On a short-staffed day: only what cannot wait. Everything else shows the day it goes due.
export function mustToday(a, today) {
  return a.action.kind !== 'none' && a.action.by != null && a.action.by <= today;
}

// The break each patient is heading into, and the day it bites. Used by the opening chart.
// Money and paperwork breaks are the ones the pharmacy sees before anyone else.
export const BREAKS = [
  { key: 'rx', label: 'No prescription for the next strength', kind: 'paperwork' },
  { key: 'pa', label: 'Approval covers the old strength only', kind: 'paperwork' },
  { key: 'cost', label: 'Card ends or coverage gap', kind: 'money' },
  { key: 'stock', label: 'Next strength out of stock', kind: 'supply' },
  { key: 'effects', label: 'Side effects or a red flag', kind: 'clinical' },
  { key: 'gap', label: 'Already out of supply', kind: 'supply' },
];
const BREAK_OF = { step: 'rx', renew: 'rx', pa: 'pa', cost: 'cost', bridge: 'cost', stock: 'stock', slow: 'effects', lower: 'effects', reassess: 'effects', hold: 'effects', 'other-drug': 'effects', restart: 'gap', refill: 'gap' };
export function breakOf(a, today = 0) {
  const t = a.action.type || a.action.kind;
  const key = BREAK_OF[t];
  if (!key) return null;
  // The day it bites: when the current supply runs out, or today for a red flag or a gap.
  const day = key === 'effects' && a.action.kind === 'hold' ? today : key === 'gap' ? today : Math.max(today, a.nextFillDay);
  return { key, day };
}
